/** 样式中定义和使用 Variable 的入口。

创建和引用变量，保存默认值与状态，并支持独立声明、调整绑定及条件修改。

这些用途共享一份默认值与状态配置，具体输出由样式中的使用位置决定。
*/
import { condition, type ConditionPath } from './condition'
import type { JSSStyleNode } from './compiler/rules-to-style-nodes'
import { allocateVariableName, type JSSKeyObject } from './key'
import { createJSSContent, isJSSContent, type Expression, type JSSCompileContext, type JSSContent } from './content'
import type { ASTController } from './compiler/ast-controller'
import type { ValueInput } from './value'
import { appendStateCondition, resolveStateConditions, type StateCondition } from './pieces/state-conditions'
import { hasProperty, mapGet, result } from '@edsolater/fnkit'
import { consumeVariable, findVariableDeclaration, findLocalBaseKey, type ModifyTargetProtocol } from './variable-modify'
import { declare } from './declaration'
import { resolveVariable } from './variable-cluster'
import { parseVariableArgs, type VariableStateValues } from './variable-args-parser'

/** 未命中状态时的基础内容；生产函数在编译消费时求值。 */
export type VariableDefaultValue = ValueInput | (() => ValueInput)

/** 样式中的可复用变量，可读取内容，也可建立局部基础值并继续修改。 */
export interface Variable extends ModifyTargetProtocol {
  kind: 'variable'
  name: string
  /** 这一个 Variable 的基础内容、状态和可选行为。 */
  config: {
    /** 未命中状态时使用的内容；生产函数在消费时求值。 */
    defaultValue: VariableDefaultValue
    /** 创建时解析条件并求状态内容，按登记顺序保存；默认生产函数在编译引用时求值。 */
    states: Map<StateCondition, ValueInput>
    registration?: VariableOptions['registration']
    /** 自动状态声明的目标 Key，始终指向当前 Variable 名称。 */
    definitionKey: JSSKeyObject
  }
  /**
   * 返回 CSS 自定义属性名（如 --amount），供声明目标使用。
   */
  toCSSString(): string
  /** 此对象最早可被编译的波次；配置含义见 VariableOptions.compileWaveIndex。 */
  compileWaveIndex?: number
  /**
   * 按当前位置生成 CSS 引用，并激活引用及声明目标所需资源。
   */
  onCompile(context: JSSCompileContext, astController: ASTController): void
}

/** 一个 Variable 的名称、各状态基础值及可选注册。 */
export interface VariableOptions<
  DefaultValue extends VariableDefaultValue = VariableDefaultValue,
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
}
/**
 * Variable，样式中的基本复用变量；状态配置此时求值，默认值生产函数在编译消费时求值。
 * 默认值也可写成 { default, ...states }，名称也可直接传字符串；两处简写可独立使用。
 * 省略名称时自动分配 temp 序号名称。
 */
export function variable<DefaultValue extends VariableDefaultValue>(
  input: DefaultValue | VariableStateValues<DefaultValue>,
  options?: string | VariableOptions<NoInfer<DefaultValue>>,
): Variable {
  const config = parseVariableArgs(input, options)
  let name = config.name.replace(/^--/, '')
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
    /**
     * 读取当前 CSS 名称；名称变化后声明与引用使用新名称。
     */
    get name() { return name },
    /**
     * 登记新的显式名称，使后续匿名对象避让当前名称。
     */
    set name(nextName) { name = allocateVariableName(nextName).replace(/^--/, '') },
    config: {
      defaultValue: config.defaultValue,
      states,
      registration: config.registration,
      get definitionKey() {
        return { toCSSString: self.toCSSString }
      },
    },
    compileWaveIndex: config.compileWaveIndex,
    onActive: config.onActive,
    /**
     * 返回当前名称对应的 CSS 自定义属性名。
     */
    toCSSString() {
      return `--${self.name}`
    },
    get key() { return self.config.definitionKey },
    get content() { return self.config.defaultValue },
    get states() { return self.config.states },
    get registration() { return self.config.registration },
    /**
     * 按声明目标或内容引用角色激活资源并提供对应内容。
     */
    onCompile: (context, astController) => compileVariableContent(self, context, astController),
  }
  return self
}

/**
 * 识别 Variable 身份，包含可调用 Cluster，不读取基础内容。
 */
export const isVariable = (input: unknown): input is Variable =>
  hasProperty(input, 'kind', (v) => v === 'variable')

/**
 * 将自定义属性材料作为内容引用；依赖原信息体，保留其资源激活关系。
 */
export const referenceVariable = (target: ModifyTargetProtocol): JSSContent & JSSKeyObject => ({
  dependencies: isJSSContent(target) ? [target] : [],
  /**
   * 作为声明目标时输出材料的当前 CSS 名称。
   */
  toCSSString: () => target.key.toCSSString(),
  /**
   * 按当前位置编译材料的引用、状态和注册资源。
   */
  onCompile: (context, controller) => compileVariableContent(target, context, controller),
})

/**
 * 按消费角色组织目标、状态或普通 CSS 引用；天然材料与 Variable 使用同一引用生命周期。
 */
export function compileVariableContent(target: ModifyTargetProtocol, context: JSSCompileContext, controller: ASTController): void {
  for (const dependency of target.declarations ?? []) {
    const existing = findVariableDeclaration(controller, dependency, context.conditionPath)
    if (existing) controller.depend(existing, { owner: context.node })
    else controller.insert({ before: context.node, conditionPath: context.conditionPath }, declare(dependency), { owner: context.node })
  }
  if (context.role === 'declaration-key') { activateVariableResources(target, context, controller); return }
  const fallback = result(target.content)
  if (target.declarations?.length) {
    const definition = findVariableDeclaration(controller, target, context.conditionPath)
    insertDefinition(context, controller, target, context.conditionPath, definition ? result(definition.content.content) : fallback)
  }
  activateVariableResources(target, context, controller)
  consumeVariable(context, controller, target)
  declareVariableStates(context, controller, target, fallback)
  const reference = createVariableReference(target, fallback)
  if (resolveVariable(context.input as ModifyTargetProtocol) !== target && isJSSContent(target)) reference.dependencies.push(target)
  controller.setContent(context, reference)
}

/**
 * 为普通引用声明当前基础值及后续状态；已有局部定义时写入其基础目标。
 * 当前位置命中状态时使用对应内容，只补登记顺序更靠后的状态。
 */
function declareVariableStates(context: JSSCompileContext, controller: ASTController, variable: ModifyTargetProtocol, fallbackValue: ValueInput): void {
  const states = [...variable.states?.keys() ?? []]
  if (!states.length) return

  const currentState = states.findLast(state => context.conditionPath.stateConditionPath.some(current => current.name === state.name))
  const currentValue = currentState ? variable.states?.get(currentState) : fallbackValue
  insertDefinition(context, controller, variable, context.conditionPath, currentValue)

  for (const [state, content] of variable.states ?? []) {
    if (currentState && state.order <= currentState.order) continue
    insertDefinition(context, controller, variable, appendStateCondition(context.conditionPath, state), content)
  }
}

/**
 * 生成样式内容的 `var(--name)` 引用；回退内容在当前声明位置编译后附在第二参数。
 */
const createVariableReference = (variable: ModifyTargetProtocol, fallbackValue: ValueInput): Expression =>
  createJSSContent((resolve) => {
    const fallback = resolve(fallbackValue)
    return fallback === undefined ? `var(${variable.key.toCSSString()})` : `var(${variable.key.toCSSString()}, ${fallback})`
  }, [fallbackValue])

/** 同一对象的激活期消费者；资源被同名对象替换后，旧对象的重复引用不重新覆盖注册。 */
const registrationSessions = new WeakMap<object, Map<ModifyTargetProtocol, Set<JSSStyleNode>>>()

/**
 * 按 registration 登记 CSS @property；对象首次消费时替换同址资源，全部消费者撤销后可再次激活。
 */
function activateVariableResources(variable: ModifyTargetProtocol, context: JSSCompileContext, controller: ASTController): void {
  const registration = variable.registration
  if (!registration) return
  const address = `variable-registration:${variable.key.toCSSString()}`
  let registrations = registrationSessions.get(context.session)
  if (!registrations) registrationSessions.set(context.session, registrations = new Map())
  const active = registrations.has(variable)
  const consumers = mapGet(registrations, variable, () => new Set<JSSStyleNode>())
  if (!consumers.has(context.node)) {
    consumers.add(context.node)
    controller.onRemove(context.node, () => {
      consumers.delete(context.node)
      if (!consumers.size) registrations.delete(variable)
    })
  }
  if (active) {
    for (const node of controller.search({ resourceAddress: address, productTag: variable })) controller.depend(node, { owner: context.node })
    return
  }
  for (const node of controller.search({ resourceAddress: address })) controller.remove(node)
  const registrationPath = {
    targetConditionPath: [condition(`@property ${variable.key.toCSSString()}`)],
    stateConditionPath: [],
  }
  const provenance = { owner: context.node, resourceAddress: address, productTag: variable }
  for (const declaration of variableRegistrationDeclarations(registration))
    controller.insert({ before: context.node, conditionPath: registrationPath }, declaration, provenance)
}

/**
 * 生成 @property 的字段内容；省略 initialValue 时不提供 initial-value，生命周期由消费方处理。
 */
export function variableRegistrationDeclarations(registration: NonNullable<VariableOptions['registration']>): [key: string, content: ValueInput][] {
  const declarations: [key: string, content: ValueInput][] = [
    ['syntax', JSON.stringify(registration.syntax)],
    ['inherits', String(registration.inherits)],
  ]
  if (registration.initialValue !== undefined) declarations.push(['initial-value', registration.initialValue])
  return declarations
}

/**
 * 在指定条件补入变量的基础值或状态值；有局部声明时写入其基础目标。
 * 同目标已有声明则保留它并返回 `undefined`，否则返回新节点。
 * 首次查找局部基础目标时，可能同时建立该声明的基础值和状态值。
 */
function insertDefinition(
  context: JSSCompileContext,
  controller: ASTController,
  variable: ModifyTargetProtocol,
  path: ConditionPath,
  content: ValueInput,
): JSSStyleNode | undefined {
  const key = findLocalBaseKey(context, controller, variable, path) ?? variable.key
  const existing = controller.search({ key, conditionPath: path })[0]
  if (existing) {
    controller.depend(existing, { owner: context.node })
    return undefined
  }
  const node = controller.insert({ before: context.node, conditionPath: path }, [key, content], { owner: context.node, productTag: variable })
  return node
}
