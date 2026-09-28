/** Variable 的公开对象与消费入口。

负责创建配置、解析引用与状态、登记资源，并将局部声明和修改交给对应实现。

调用方通过同一对象取得稳定引用和局部声明，编译时按当前位置展开。
*/
import { condition, type ConditionPath } from './condition'
import type { Declaration } from './declaration'
import type { JSSStyleNode } from './compiler/rules-to-style-nodes'
import type { JSSKeyObject } from './key'
import { createJSSContent, isJSSContent, type JSSContent } from './content'
import type { ASTController } from './compiler/ast-controller'
import { value, type ValueInput } from './value'
import { resolveStateConditions } from './pieces/state-conditions'
import { shrinkFn } from '@edsolater/fnkit'
import { declareVariable, findLocalBaseKey, modifyVariable } from './variable-modification'

/** 创建首参数的稳定默认值；生产函数只在编译消费时执行。 */
export type VariableDefaultValue = ValueInput | (() => ValueInput)

/** 可引用、局部定义并相对修改的 CSS Variable。 */
export interface Variable extends JSSContent {
  kind: 'variable'
  name: string
  /** Variable 自身的创建配置。 */
  config: {
    defaultValue: VariableDefaultValue
    /** 创建时求得的各状态对应内容。 */
    states: Map<string, ValueInput>
    modification?: VariableOptions<VariableDefaultValue, unknown>['modification']
    registration?: VariableOptions['registration']
    /** 使用时按当前名称生成自动状态声明的 Key。 */
    definitionKey: JSSKeyObject
  }
  /**
   * 返回当前位置的局部声明，编译消费时才展开。
   * 省略 content 使用创建默认值；显式 undefined 不提供基础内容。
   */
  declare(content?: ValueInput): Declaration
  /**
   * 返回相对修改声明，归属于语义父链上最近的同一 Variable 局部声明。
   * 编译时由 modification.apply 解释 change；条件是否成立由 CSS 判断。
   */
  modify(
    change: unknown,
    options?: {
      /**
       * 省略时，每次调用产生可叠加的独立修改项。
       * 同一局部声明内，相同 ID 共享修改项，其条件赋值由 CSS 层叠覆盖。
       * 不同局部声明的 ID 互不影响；ID 不决定修改顺序。
       */
      id?: string | symbol
    },
  ): Declaration
  /** 返回声明目标名（如 --amount）；内容引用的 var(...) 由 parse 产生。 */
  toCSSString(): string
  /** 此对象最早可被解析的波次；配置含义见 VariableOptions.parseWaveIndex。 */
  parseWaveIndex?: number
  /** 编译器消费引用的入口：按需登记状态与资源，返回可继续解析的 CSS 引用内容。 */
  parse(astController: ASTController, readState?: string): ValueInput
}
/** Variable 创建时的名称与可选行为。 */
export interface VariableOptions<
  DefaultValue extends VariableDefaultValue = VariableDefaultValue,
  Change = ValueInput,
> {
  name: string
  /**
   * State Condition 名称对应的基础内容；与 modify 同时生效时先选基础值再修改。
   * 回调在创建时执行，接收原始 defaultValue，包括尚未求值的生产函数。
   */
  states?: Record<string, ValueInput | ((defaultValue: DefaultValue) => ValueInput)>

  /** 首次消费时提供按需 Rules；与普通 JSSContent.onActive 使用同一生命周期。 */
  onActive?: JSSContent['onActive']

  /** 使用此 Variable 时输出对应的 CSS @property 注册。 */
  registration?: {
    /** CSS 值语法，如 <number>、<length>、<color> 或 *；明确类型也用于内部修改步骤。 */
    syntax: string
    /** 是否继承父元素的该属性值。 */
    inherits: boolean
    /** 独立的 CSS initial-value；省略不输出，不从 defaultValue 推断。 */
    initialValue?: ValueInput
  }

  /**
   * 此 Variable 最早可解析的波次，须为非负整数；省略为 0。
   * 仅控制内容解析时机，不决定修改顺序。
   */
  parseWaveIndex?: number
  /** 为 modify 提供相对修改能力；不调用 modify 时可省略。 */
  modification?: {
    /**
     * 编译时构造相对修改的内容表达式，返回值继续交给普通解析；浏览器条件变化不会重调此函数。
     * @param currentValue 前序结果的 CSS 内容引用，不是浏览器计算值。
     * @param change modify 传入的原样数据，由此函数解释或忽略，框架不校验形状。
     */
    apply(currentValue: ValueInput, change: Change): ValueInput
  }
}
/** 创建 Variable；立即求得状态内容，默认值生产函数在编译消费时才执行。 */
export function variable<DefaultValue extends VariableDefaultValue, Change = ValueInput>(
  defaultValue: DefaultValue,
  options: VariableOptions<NoInfer<DefaultValue>, Change>,
): Variable {
  const states = new Map<string, ValueInput>()
  for (const [name, content] of Object.entries(options.states ?? {})) {
    states.set(name, isJSSContent(content) ? content : shrinkFn(content, [defaultValue]))
  }
  const self: Variable = {
    kind: 'variable',
    name: options.name.replace(/^--/, ''),
    config: {
      defaultValue,
      states,
      modification: options.modification,
      registration: options.registration,
      get definitionKey() {
        return { toCSSString: () => self.toCSSString() }
      },
    },
    parseWaveIndex: options.parseWaveIndex,
    onActive: options.onActive,
    declare(...contents) {
      return declareVariable(self, contents.length ? contents[0] : self.config.defaultValue, activateVariableResources)
    },
    modify(change, options) {
      return modifyVariable(self, change, options?.id)
    },
    toCSSString() {
      return `--${self.name}`
    },
    parse(astController, readState) {
      if (astController.role === 'declaration-key') {
        activateVariableResources(self, astController)
        return value(`var(--${self.name})`)
      }
      const fallbackValue = isJSSContent(self.config.defaultValue)
        ? self.config.defaultValue
        : shrinkFn(self.config.defaultValue)
      if (readState !== undefined) {
        return self.config.states.has(readState) ? self.config.states.get(readState) : fallbackValue
      }
      activateVariableResources(self, astController)
      const stateConditions = resolveStateConditions([...self.config.states.keys()])
      const activeState = [...stateConditions]
        .reverse()
        .find((state) => astController.conditionPath.stateConditionPath.some((current) => current.name === state.name))
      if (stateConditions.length) {
        const defaultValue =
          activeState && self.config.states.has(activeState.name)
            ? self.config.states.get(activeState.name)
            : fallbackValue
        insertDefinition(astController, self, astController.conditionPath, defaultValue, activeState?.name)

        for (const state of stateConditions) {
          if (activeState && state.order <= activeState.order) continue
          const stateValue = self.config.states.has(state.name) ? self.config.states.get(state.name) : fallbackValue
          insertDefinition(
            astController,
            self,
            {
              semanticPath: [
                ...(astController.conditionPath.semanticPath ?? [
                  ...astController.conditionPath.targetConditionPath,
                  ...astController.conditionPath.stateConditionPath.map((item) => item.name),
                ]),
                state.name,
              ],
              targetConditionPath: [...astController.conditionPath.targetConditionPath],
              stateConditionPath: resolveStateConditions([
                ...astController.conditionPath.stateConditionPath.map((current) => current.name),
                state.name,
              ]),
            },
            stateValue,
            state.name,
          )
        }
      }

      const contents: ValueInput[] = fallbackValue === undefined ? [] : [fallbackValue]
      return value(
        createJSSContent((read) => {
          const fallback = contents.length ? read(contents[0]) : undefined
          return fallback === undefined ? `var(--${self.name})` : `var(--${self.name}, ${fallback})`
        }, contents),
      )
    },
  }
  return self
}

/** 在 Variable 被消费时登记一次对应的 CSS @property 资源。 */
function activateVariableResources(reference: Variable, controller: ASTController): void {
  controller.withClaim(reference, () => {
    const registration = reference.config.registration
    if (registration) {
      const address = `variable-registration:${reference.name}`
      controller.replaceResource(address)
      const registrationPath = {
        targetConditionPath: [condition(`@property --${reference.name}`)],
        stateConditionPath: [],
      }
      controller.insertResource(address, registrationPath, 'syntax', JSON.stringify(registration.syntax))
      controller.insertResource(address, registrationPath, 'inherits', String(registration.inherits))
      if (registration.initialValue !== undefined)
        controller.insertResource(address, registrationPath, 'initial-value', registration.initialValue)
    }
  })
}

/** 在目标地址生成 Variable 声明；局部声明覆盖同一 Variable 的自动声明。 */
function insertDefinition(
  controller: ASTController,
  reference: Variable,
  path: ConditionPath,
  content: ValueInput,
  readState?: string,
): JSSStyleNode | undefined {
  const key = findLocalBaseKey(controller, reference, path) ?? reference.config.definitionKey
  const existing = controller.findByKey(key, path)
  if (existing) {
    controller.retain(existing)
    return undefined
  }
  const node = controller.insert(path, key, content, 'before', reference)
  node.readState = readState
  return node
}
