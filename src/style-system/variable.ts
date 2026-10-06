/** 样式中定义和使用 Variable 的入口。

创建可复用的变量，并为声明目标、状态读取和普通引用提供对应的 CSS 内容。

这些用途共享一份默认值与状态配置，具体输出由样式中的使用位置决定。
*/
import { condition, type ConditionPath } from './condition'
import type { JSSStyleNode } from './compiler/rules-to-style-nodes'
import type { JSSKeyObject } from './key'
import { createJSSContent, type JSSCompileContext, type JSSContent } from './content'
import type { ASTController } from './compiler/ast-controller'
import { value, type ValueInput } from './value'
import { appendStateCondition, resolveStateConditions, type StateCondition } from './pieces/state-conditions'
import { result } from '@edsolater/fnkit'
import { consumeVariable, findLocalBaseKey } from './variable-modification'
import type { Expression } from './content'
import { parseVariableArgs, type VariableStateValues } from './variable-args-parser'

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
    /** 创建时解析条件并求内容，按登记顺序保存；命中时不求默认值。 */
    states: Map<StateCondition, ValueInput>
    modification?: VariableOptions<VariableDefaultValue, unknown>['modification']
    registration?: VariableOptions['registration']
    /** 自动状态声明的目标 Key，始终指向当前 Variable 名称。 */
    definitionKey: JSSKeyObject
  }
  /** 返回 CSS 自定义属性名（如 --amount），供声明目标使用。 */
  toCSSString(): string
  /** 此对象最早可被编译的波次；配置含义见 VariableOptions.compileWaveIndex。 */
  compileWaveIndex?: number
  /**
   * 为样式中的三种用途提供对应内容：
   * 声明目标：登记注册资源，保持当前 Variable 的目标 Key。
   * 指定状态：设定本 Variable 的同名状态内容；未命中才读取默认内容，不登记资源。
   * 普通引用：设定 var(...) 内容，并生成注册资源与自身状态声明；默认内容可作为回退。
   */
  onCompile(context: JSSCompileContext, astController: ASTController): void
}
/** 一个 Variable 的名称、各状态基础值及可选的注册和修改能力。 */
export interface VariableOptions<
  DefaultValue extends VariableDefaultValue = VariableDefaultValue,
  Change = ValueInput,
> {
  /** CSS 自定义属性名；可带或省略开头的 --，省略时由入口分配 temp 序号名称。 */
  name?: string
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
   * 此 Variable 最早可编译的波次，须为非负整数；省略为 0。
   * 仅控制内容编译时机，不决定修改顺序。
   */
  compileWaveIndex?: number
  /** 为 modify 提供相对修改能力；不调用 modify 时可省略。 */
  modification?: {
    /**
     * 编译时根据前序引用与 change 生成内容表达式，再交给普通内容编译。
     * 浏览器条件变化不会重调此函数。
     * @param currentExpression 前序结果的延迟 CSS 表达式，不是浏览器计算值。
     * @param modification modify 传入的完整规则或原样数据，由本配置解释。
     */
    apply(currentExpression: Expression, modification: Change): Expression
  }
}
/**
 * Variable，样式中的基本复用变量；状态配置此时求值，默认值生产函数在编译消费时求值。
 * 默认值也可写成 { default, ...states }，名称也可直接传字符串；两处简写可独立使用。
 * 省略名称时自动分配 temp 序号名称。
 */
export function variable<DefaultValue extends VariableDefaultValue, Change = ValueInput>(
  input: DefaultValue | VariableStateValues<DefaultValue>,
  options?: string | VariableOptions<NoInfer<DefaultValue>, Change>,
): Variable {
  const config = parseVariableArgs(input, options)
  const entries = Object.entries(config.states ?? {})
  const conditions = resolveStateConditions(entries.map(([name]) => name))
  const states = new Map<StateCondition, ValueInput>(
    entries.map(([name, content]): [StateCondition, ValueInput] => [
      conditions.find((state) => state.name === name)!, result(content, config.defaultValue),
    ])
      .sort(([left], [right]) => left.order - right.order),
  )
  const self: Variable = {
    kind: 'variable',
    name: config.name.replace(/^--/, ''),
    config: {
      defaultValue: config.defaultValue,
      states,
      modification: config.modification,
      registration: config.registration,
      get definitionKey() {
        return { toCSSString: () => self.toCSSString() }
      },
    },
    compileWaveIndex: config.compileWaveIndex,
    onActive: config.onActive,
    toCSSString() {
      return `--${self.name}`
    },
    onCompile(context, astController) {
      if (context.role === 'declaration-key') {
        activateVariableResources(self, context, astController)
        return
      }
      if (context.readState) {
        astController.setContent(context, readVariableContent(self, context.readState))
        return
      }

      activateVariableResources(self, context, astController)
      consumeVariable(context, astController, self)
      const fallbackValue = readVariableContent(self)
      declareVariableStates(context, astController, self, fallbackValue)
      astController.setContent(context, createVariableReference(self, fallbackValue))
    },
  }
  return self
}

/** 读取此 Variable 的指定状态；只有状态缺项时才求默认内容。 */
function readVariableContent(variable: Variable, readState?: string): ValueInput {
  const entry = readState === undefined ? undefined : [...variable.config.states].find(([state]) => state.name === readState)
  return entry ? entry[1] : result(variable.config.defaultValue)
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
function declareVariableStates(context: JSSCompileContext, controller: ASTController, variable: Variable, fallbackValue: ValueInput): void {
  const states = [...variable.config.states.keys()]
  if (!states.length) return

  const currentState = findCurrentState(states, context.conditionPath)
  const currentValue = currentState ? variable.config.states.get(currentState) : fallbackValue
  insertDefinition(context, controller, variable, context.conditionPath, currentValue, currentState?.name)

  for (const [state, content] of variable.config.states) {
    if (currentState && state.order <= currentState.order) continue
    insertDefinition(context, controller, variable, appendStateCondition(context.conditionPath, state), content, state.name)
  }
}

/** 生成样式内容的 `var(--name)` 引用；回退内容在当前声明位置编译后附在第二参数。 */
function createVariableReference(variable: Variable, fallbackValue: ValueInput): ValueInput {
  const contents: ValueInput[] = fallbackValue === undefined ? [] : [fallbackValue]
  return value(
    createJSSContent((resolve) => {
      const fallback = contents.length ? resolve(contents[0]) : undefined
      return fallback === undefined ? `var(--${variable.name})` : `var(--${variable.name}, ${fallback})`
    }, contents),
  )
}

/** 同一对象的激活期消费者；资源被同名对象替换后，旧对象的重复引用不重新覆盖注册。 */
const registrationSessions = new WeakMap<object, Map<Variable, Set<JSSStyleNode>>>()

/** 按 registration 登记 CSS @property；对象首次消费时替换同址资源，全部消费者撤销后可再次激活。 */
function activateVariableResources(variable: Variable, context: JSSCompileContext, controller: ASTController): void {
  const registration = variable.config.registration
  if (!registration) return
  const address = `variable-registration:${variable.name}`
  let registrations = registrationSessions.get(context.session)
  if (!registrations) registrationSessions.set(context.session, registrations = new Map())
  let consumers = registrations.get(variable)
  const active = consumers !== undefined
  if (!consumers) registrations.set(variable, consumers = new Set())
  if (!consumers.has(context.node)) {
    consumers.add(context.node)
    const currentConsumers = consumers
    controller.onRemove(context.node, () => {
      currentConsumers.delete(context.node)
      if (!currentConsumers.size) registrations.delete(variable)
    })
  }
  if (active) {
    for (const node of controller.search({ resourceAddress: address, productTag: variable })) controller.depend(node, { owner: context.node })
    return
  }
  for (const node of controller.search({ resourceAddress: address })) controller.remove(node)
  const registrationPath = {
    targetConditionPath: [condition(`@property --${variable.name}`)],
    stateConditionPath: [],
  }
  const provenance = { owner: context.node, resourceAddress: address, productTag: variable }
  for (const declaration of variableRegistrationDeclarations(registration))
    controller.insert({ before: context.node, conditionPath: registrationPath }, declaration, provenance)
}

/** 生成 @property 的字段内容；省略 initialValue 时不提供 initial-value，生命周期由消费方处理。 */
export function variableRegistrationDeclarations(registration: NonNullable<VariableOptions['registration']>): [key: string, content: ValueInput][] {
  const declarations: [key: string, content: ValueInput][] = [
    ['syntax', JSON.stringify(registration.syntax)],
    ['inherits', String(registration.inherits)],
  ]
  if (registration.initialValue !== undefined) declarations.push(['initial-value', registration.initialValue])
  return declarations
}

/** 在指定条件补入变量的基础值或状态值；有局部声明时写入其基础目标。
 * 同目标已有声明则保留它并返回 `undefined`，否则返回新节点。
 * 首次查找局部基础目标时，可能同时建立该声明的基础值和状态值。
 */
function insertDefinition(
  context: JSSCompileContext,
  controller: ASTController,
  variable: Variable,
  path: ConditionPath,
  content: ValueInput,
  readState?: string,
): JSSStyleNode | undefined {
  const key = findLocalBaseKey(context, controller, variable, path) ?? variable.config.definitionKey
  const existing = controller.search({ key, conditionPath: path })[0]
  if (existing) {
    controller.depend(existing, { owner: context.node })
    return undefined
  }
  const node = controller.insert({ before: context.node, conditionPath: path }, [key, content], { owner: context.node, productTag: variable })
  node.readState = readState
  return node
}
