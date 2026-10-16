/** 样式中定义和使用 Variable 的入口。

创建和引用变量，保存默认值与状态，并支持独立声明、调整绑定及条件修改。

这些用途共享一份默认值与状态配置，具体输出由样式中的使用位置决定。
*/
import { condition } from './condition'
import type { JSSStyleNode } from './compiler/rules-to-style-nodes'
import { allocateVariableName, type JSSKeyObject } from './key'
import { createJSSContent, isJSSContent, type Expression, type JSSCompileContext, type JSSContent } from './content'
import type { ASTController } from './compiler/ast-controller'
import type { ValueInput } from './value'
import { resolveStateConditions, type StateCondition } from './pieces/state-conditions'
import { hasProperty, mapGet, result } from '@edsolater/fnkit'
import { consumeVariable, findVariableDeclaration, joinVariableValues, type ModifyTargetProtocol } from './variable-modify'
import { declare } from './declaration'
import { resolveVariable } from './variable-cluster'
import { parseVariableArgs, type VariableStateValues } from './variable-args-parser'
import { observeVariable } from './variable-dependency'

/** 未命中状态时的声明内容；生产函数在编译消费时求值。 */
export type VariableDefaultValue = ValueInput | (() => ValueInput)
/** 状态配方中的 base 是本次声明的基础内容，不是同名变量引用。 */
export type VariableStateRule = ValueInput | ((base: ValueInput) => ValueInput)

/** 样式中的可复用变量，可读取内容，也可建立局部基础值并继续修改。 */
export interface Variable extends ModifyTargetProtocol, JSSKeyObject {
  kind: 'variable'
  name: string
  priority: number
  /** 这一个 Variable 的基础内容、状态和可选行为。 */
  config: {
    /** 未命中状态时使用的内容；生产函数在消费时求值。 */
    defaultValue: VariableDefaultValue
    /** 条件按登记顺序保存，原始规则在每次声明时绑定当地基础内容。 */
    states: Map<StateCondition, VariableStateRule>
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
export interface VariableOptions {
  /** CSS 自定义属性名；可带或省略开头的 --，只有 extend 可沿用来源名称。 */
  name?: string
  /** 继承名称、默认内容及原始状态规则；未指定等级时使用来源等级加一。 */
  extend?: Variable
  /** 声明键等级；普通创建默认0，继承默认来源等级加一，显式0仍生效。 */
  priority?: number
  /**
   * 各 State Condition 下使用的基础内容；修改从选中的基础内容继续。
   * 回调在声明展开时执行，收到本次声明基础内容；extend 保留规则并重新绑定。
   */
  states?: Record<string, VariableStateRule>

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
 * Variable，样式中的基本复用变量；默认值生产函数在编译消费时求值，状态规则随每次声明绑定。
 * 默认值也可写成 { default, ...states }，名称也可直接传字符串；两处简写可独立使用。
 * 普通创建必须提供默认内容及名称；extend 可继承这两项。
 */
export function variable(options: VariableOptions & { extend: Variable }): Variable
export function variable<DefaultValue extends VariableDefaultValue>(
  input: DefaultValue | VariableStateValues<DefaultValue>,
  options: string | (VariableOptions & ({ name: string } | { extend: Variable })),
): Variable
export function variable(input: VariableDefaultValue | VariableStateValues | (VariableOptions & { extend: Variable }), options?: string | VariableOptions): Variable {
  const config = parseVariableArgs(input as VariableDefaultValue, options)
  let name = config.name.replace(/^--/, '')
  const entries = Object.entries(config.states ?? {})
  const conditions = resolveStateConditions(entries.map(([name]) => name))
  const states = new Map<StateCondition, VariableStateRule>(
    entries.map(([name, content]): [StateCondition, VariableStateRule] => [
      conditions.find((state) => state.name === name)!, content,
    ])
      .sort(([left], [right]) => left.order - right.order),
  )
  const self: Variable = {
    kind: 'variable',
    priority: config.priority,
    /**
     * 读取当前 CSS 名称；名称变化后声明与引用使用新名称。
     */
    get name() { return name },
    /**
     * 登记新的显式名称，使内部名称分配避让当前名称。
     */
    set name(nextName) { name = allocateVariableName(nextName).replace(/^--/, '') },
    config: {
      defaultValue: config.defaultValue,
      states,
      registration: config.registration,
      get definitionKey() {
        return { toCSSString: self.toCSSString, priority: self.priority, join: joinVariableValues }
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
    get join() { return joinVariableValues },
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
  const defaultContent = result(target.content)
  activateVariableResources(target, context, controller)
  consumeVariable(context, controller, target)
  observeVariable(target, defaultContent, context, controller)
  const reference = createVariableReference(target, defaultContent)
  if (resolveVariable(context.input as ModifyTargetProtocol) !== target && isJSSContent(target)) reference.dependencies.push(target)
  controller.setContent(context, reference)
}

/**
 * 引用只输出 CSS 名称；结构化内容继续提供依赖与按需资源。
 */
const createVariableReference = (variable: ModifyTargetProtocol, content: ValueInput): Expression =>
  createJSSContent(() => `var(${variable.key.toCSSString()})`, [content])
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
