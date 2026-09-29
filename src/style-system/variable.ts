/** 样式中定义和使用 Variable 的入口。

创建可复用的变量，并为声明目标、状态读取和普通引用提供对应的 CSS 内容。

这些用途共享一份默认值与状态配置，具体输出由样式中的使用位置决定。
*/
import { condition, type ConditionPath } from './condition'
import type { Declaration } from './declaration'
import type { JSSStyleNode } from './compiler/rules-to-style-nodes'
import type { JSSKeyObject } from './key'
import { createJSSContent, type JSSContent } from './content'
import type { ASTController } from './compiler/ast-controller'
import { value, type ValueInput } from './value'
import { appendStateCondition, resolveStateConditions, type StateCondition } from './pieces/state-conditions'
import { get, result } from '@edsolater/fnkit'
import { declareVariable, findLocalBaseKey, modifyVariable } from './variable-modification'

/** 未命中状态时的基础内容；生产函数在编译消费时求值。 */
export type VariableDefaultValue = ValueInput | (() => ValueInput)

/** 样式中的可复用变量，可读取内容，也可建立局部基础值并继续修改。 */
export interface Variable extends JSSContent {
  kind: 'variable'
  name: string
  /** 这一个 Variable 的基础内容、状态和可选行为。 */
  config: {
    /** 未命中状态时使用的内容；生产函数在消费时求值。 */
    defaultValue: VariableDefaultValue
    /** 各状态的基础内容；创建时求得，命中时不求默认值。 */
    states: Map<string, ValueInput>
    modification?: VariableOptions<VariableDefaultValue, unknown>['modification']
    registration?: VariableOptions['registration']
    /** 自动状态声明的目标 Key，始终指向当前 Variable 名称。 */
    definitionKey: JSSKeyObject
  }
  /**
   * 在当前样式位置声明基础值，供此处及下级条件中的 modify 修改。
   * 返回的声明在编译消费时生效。
   * 省略 content 使用创建默认值；显式传入 undefined 则不提供基础内容。
   * @example 已配置修改能力的 amount：
   * `rules('.Button', [amount.declare(10)])`
   * `rules(['.Button', 'hover'], [amount.modify(2)])`
   */
  declare(content?: ValueInput): Declaration
  /**
   * 在最近的局部声明上叠加一次修改，所在样式条件由 CSS 决定是否生效。
   * 只查找同一 Variable 对象的声明。
   * 返回的声明在编译消费时由 modification.apply 将 change 转为 CSS。
   * 缺少局部声明或修改能力会报错。
   */
  modify(
    change: unknown,
    options?: {
      /**
       * 省略时每次调用形成独立步骤；同一局部声明内相同 ID 共用一步。
       * 共用步骤的条件赋值由 CSS 层叠选择；不同局部声明互不影响。
       * ID 不决定步骤顺序。
       */
      id?: string | symbol
    },
  ): Declaration
  /** 返回 CSS 自定义属性名（如 --amount），供声明目标使用。 */
  toCSSString(): string
  /** 此对象最早可被解析的波次；配置含义见 VariableOptions.parseWaveIndex。 */
  parseWaveIndex?: number
  /**
   * 为样式中的三种用途提供对应内容：
   * 声明目标：返回 var(...) 引用，并登记注册资源。
   * 指定状态：读取本 Variable 的同名状态；未命中才读取默认内容，不登记资源。
   * 普通引用：返回 var(...)，并生成注册资源与自身状态声明；默认内容可作为回退。
   */
  parse(astController: ASTController, readState?: string): ValueInput
}
/** 一个 Variable 的名称、各状态基础值及可选的注册和修改能力。 */
export interface VariableOptions<
  DefaultValue extends VariableDefaultValue = VariableDefaultValue,
  Change = ValueInput,
> {
  /** CSS 自定义属性名；可带或省略开头的 --。 */
  name: string
  /**
   * 各 State Condition 下使用的基础内容；修改从选中的基础内容继续。
   * 回调在创建时执行，收到原始 defaultValue，包括尚未求值的生产函数。
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
     * 编译时根据前序引用与 change 生成内容表达式，再交给普通解析。
     * 浏览器条件变化不会重调此函数。
     * @param currentValue 前序结果的 CSS 引用，不是浏览器计算值。
     * @param change modify 传入的原样数据；框架不校验其形状。
     */
    apply(currentValue: ValueInput, change: Change): ValueInput
  }
}
/** 创建可在样式中复用的 Variable；状态配置此时求值，默认值生产函数在编译消费时求值。 */
export function variable<DefaultValue extends VariableDefaultValue, Change = ValueInput>(
  defaultValue: DefaultValue,
  options: VariableOptions<NoInfer<DefaultValue>, Change>,
): Variable {
  const states = new Map<string, ValueInput>(
    Object.entries(options.states ?? {}).map(([name, content]) => [name, result(content, defaultValue)]),
  )
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
      if (readState) return readVariableContent(self, readState)

      activateVariableResources(self, astController)
      const fallbackValue = readVariableContent(self)
      declareVariableStates(astController, self, fallbackValue)
      return createVariableReference(self, fallbackValue)
    },
  }
  return self
}

/** 读取此 Variable 的指定状态；只有状态缺项时才求默认内容。 */
function readVariableContent(variable: Variable, readState?: string): ValueInput {
  return get(variable.config.states, readState, variable.config.defaultValue)
}

/** 从按登记顺序排列的候选中，取当前路径最后命中的状态。 */
function findCurrentState(states: StateCondition[], path: ConditionPath): StateCondition | undefined {
  return states.findLast((state) => path.stateConditionPath.some((current) => current.name === state.name))
}

/** 为普通引用写出当前位置和后续状态的变量声明。
 * `n` 默认 `4`、hover 为 `8`，首次在 `.button` 普通引用且无局部声明时生成：
 * ```css
 * .button {
 *   --n: 4;
 *   &:where(:where(:hover):where(:not(:disabled, [data-status~="disabled"]))) {
 *     --n: 8;
 *   }
 * }
 * ```
 * 若当前位置仅命中 hover，则当前值为 `8`，只再补登记顺序靠后的状态。
 */
function declareVariableStates(controller: ASTController, variable: Variable, fallbackValue: ValueInput): void {
  const stateConditions = resolveStateConditions([...variable.config.states.keys()])
  if (!stateConditions.length) return

  const currentState = findCurrentState(stateConditions, controller.conditionPath)
  const currentValue = currentState ? variable.config.states.get(currentState.name) : fallbackValue
  insertDefinition(controller, variable, controller.conditionPath, currentValue, currentState?.name)

  for (const state of stateConditions) {
    if (currentState && state.order <= currentState.order) continue
    const stateValue = variable.config.states.get(state.name)
    insertDefinition(controller, variable, appendStateCondition(controller.conditionPath, state.name), stateValue, state.name)
  }
}

/** 生成样式内容的 `var(--name)` 引用；回退内容解析出值时附在第二参数。 */
function createVariableReference(variable: Variable, fallbackValue: ValueInput): ValueInput {
  const contents: ValueInput[] = fallbackValue === undefined ? [] : [fallbackValue]
  return value(
    createJSSContent((read) => {
      const fallback = contents.length ? read(contents[0]) : undefined
      return fallback === undefined ? `var(--${variable.name})` : `var(--${variable.name}, ${fallback})`
    }, contents),
  )
}

/** 按 registration 为正在使用的 Variable 登记 CSS @property；未配置则不输出。 */
function activateVariableResources(variable: Variable, controller: ASTController): void {
  controller.withClaim(variable, () => {
    const registration = variable.config.registration
    if (registration) {
      const address = `variable-registration:${variable.name}`
      controller.replaceResource(address)
      const registrationPath = {
        targetConditionPath: [condition(`@property --${variable.name}`)],
        stateConditionPath: [],
      }
      controller.insertResource(address, registrationPath, 'syntax', JSON.stringify(registration.syntax))
      controller.insertResource(address, registrationPath, 'inherits', String(registration.inherits))
      if (registration.initialValue !== undefined)
        controller.insertResource(address, registrationPath, 'initial-value', registration.initialValue)
    }
  })
}

/** 在指定条件补入变量的基础值或状态值；有局部声明时写入其基础目标。
 * 同目标已有声明则保留它并返回 `undefined`，否则返回新节点。
 * 首次查找局部基础目标时，可能同时建立该声明的基础值和状态值。
 */
function insertDefinition(
  controller: ASTController,
  variable: Variable,
  path: ConditionPath,
  content: ValueInput,
  readState?: string,
): JSSStyleNode | undefined {
  const key = findLocalBaseKey(controller, variable, path) ?? variable.config.definitionKey
  const existing = controller.findByKey(key, path)
  if (existing) {
    controller.retain(existing)
    return undefined
  }
  const node = controller.insert(path, key, content, 'before', variable)
  node.readState = readState
  return node
}
