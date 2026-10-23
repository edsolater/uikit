/** 样式中 Variable 的定义与消费主体。

创建和引用变量，保存根据地、状态与变体，并支持独立声明及完整结果加工。

使用时保障根据地有定义；状态随根据地展开，消费位置只读取 CSS 引用。
*/
import { condition, type ConditionInput } from '../condition'
import { propertyName, type JSSKeyObject } from '../key'
import { createJSSContent, isJSSContent, type JSSCompileContext, type JSSContent } from '../content'
import type { ValueInput } from '../value'
import { resolveStateConditions, type StateCondition } from '../pieces/state-conditions'
import { assert, hasProperty, isFunction, mapGet } from '@edsolater/fnkit'
import { consumeDeclaration, declaredVariable, declareVariable, joinVariableValues } from './declare'
import type { DeclareProtocol } from '../operations/declare'
import { parseVariableArgs, type VariableStateValues } from './args-parser'
import { getVariableNameAddress, type VariableName } from './name'
import { variantSelections } from './variant-selections'
import type { JSSStyleNode, ASTController } from '../compiler/contracts'

/** 未命中状态时的声明内容；生产函数消费时无参执行。 */
export type VariableDefaultValue = ValueInput
/** 状态配方中的 base 是根据地声明的基础内容，不是同名变量引用。 */
export type VariableStateRule = ValueInput | ((base: ValueInput) => ValueInput)
/** 用途变体生成新基础，也可用 default 简写补充该部分的状态；固定内容原样保留。 */
export type VariableVariantRule = ValueInput | VariableStateValues | ((base: ValueInput) => ValueInput | VariableStateValues)
/** 定义的存在位置，复用 rules 的条件材料。 */
export type VariableAddress = Exclude<ConditionInput, undefined>

/** 同一来源的顶层资源保持一份内容身份，多个加工结果共享其生命周期。 */
const variableActivations = new WeakMap<VariableTarget, JSSContent>()
const adjustmentActivations = new WeakMap<VariableTarget, JSSContent>()

/** 保留原始定义，在声明结果处统一加工，状态与变体不重复执行。 */
export function transformVariable(source: VariableTarget, apply: (content: ValueInput) => ValueInput, name: string): Variable {
  const result = isVariable(source)
    ? variableFrom(source, source.content, name)
    : variable(source.content, {
      name, address: source.address,
      states: source.states && Object.fromEntries([...source.states].map(([state, rule]) => [state.name, rule])),
    })
  result.config.resultTransforms = [...source.resultTransforms ?? [], apply]
  result.config.resultSource = source
  result.config.resultSourceTransform = apply
  return result
}

/** 显式加工绑定读取来源当前值；定义复用不会继承这条绑定。 */
export const variableResultSource = (target: VariableTarget): VariableTarget | undefined => isVariable(target) ? target.config.resultSource : undefined

/** 自定义属性材料；状态与注册仅在材料实际持有时参与。 */
export interface VariableTarget extends DeclareProtocol, JSSContent {
  states?: Map<StateCondition, VariableStateRule>
  registration?: VariableOptions['registration']
  address?: VariableAddress
  resultTransforms?: ((content: ValueInput) => ValueInput)[]
}

/** 样式中的可复用变量，可读取内容，也可建立局部基础值并继续修改。 */
export interface Variable extends VariableTarget, JSSKeyObject {
  kind: 'variable'
  get name(): VariableName
  priority: number
  /** 选择变体，以新默认值生成保留状态的 Variable；结果不携带来源的变体定义。 */
  variant(name: string): Variable
  /** 这一个 Variable 的基础内容、状态、变体和可选行为。 */
  config: {
    address: VariableAddress
    resultTransforms: ((content: ValueInput) => ValueInput)[]
    resultSource?: VariableTarget
    resultSourceTransform?: (content: ValueInput) => ValueInput
    resourceSource?: VariableTarget
    /** 未命中状态时使用的内容；生产函数在消费时求值。 */
    defaultValue: VariableDefaultValue
    /** 条件按登记顺序保存，原始规则只在根据地声明时绑定基础内容。 */
    states: Map<StateCondition, VariableStateRule>
    variants?: Record<string, VariableVariantRule>
    registration?: VariableOptions['registration']
    /** 自动状态声明的目标 Key，指向注册时绑定的名称。 */
    definitionKey: JSSKeyObject
  }
  /**
   * 返回 CSS 自定义属性名（如 --amount），供声明目标使用。
   */
  toCSSString(): string
  /**
   * 按当前位置生成 CSS 引用，并激活引用及声明目标所需资源。
   */
  onCompile(context: JSSCompileContext, astController: ASTController): void
}

/** 一个 Variable 的名称、状态与变体定义，以及可选注册。 */
export interface VariableOptions {
  /** 使用时保障这个地址存在声明；省略为 root，复用时沿用来源地址。 */
  address?: VariableAddress
  /** 独立 Name 或创建 Name 的字符串简写；字符串可带 --，variableFrom 可沿用来源身份。 */
  name?: string | VariableName
  /** 声明键等级；普通创建默认0，继承默认来源等级加一，显式0仍生效。 */
  priority?: number
  /**
   * 各 State Condition 下使用的基础内容；修改从选中的基础内容继续。
   * 回调在根据地展开时执行，收到该处声明基础内容；variableFrom 保留规则并重新绑定。
   */
  states?: Record<string, VariableStateRule>
  /** 变体规则或固定基础；variableFrom 按名称继承，显式同名项覆盖。 */
  variants?: Record<string, VariableVariantRule>

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
   * 该定义内容最早可编译的波次，须为非负整数；省略为 0。
   * 仅控制内容编译时机，不决定修改顺序。
   */
  compileWaveIndex?: number
}
/** 派生定义可直接命名，也可按来源逻辑名计算新名称。 */
export type VariableFromName = string | VariableName | ((name: VariableName) => string | VariableName)

/**
 * Variable，样式中的基本复用变量；默认值生产函数在编译消费时求值，状态规则只随根据地声明绑定。
 * 默认值也可写成 { default, ...states }，名称也可直接传字符串；两处简写可独立使用。
 * 普通创建必须提供默认内容及名称；variableFrom 可沿用来源名称。
 */
export function variable<DefaultValue extends VariableDefaultValue>(
  input: DefaultValue | VariableStateValues<DefaultValue>,
  options: string | (VariableOptions & { name: string | VariableName }),
): Variable {
  return createVariable(input, options)
}

/** 从来源创建独立定义；规则和固定值原样继承，显式配置只改变新定义。 */
export function variableFrom<DefaultValue extends VariableDefaultValue>(
  source: Variable,
  input: DefaultValue | VariableStateValues<DefaultValue>,
  nameOrOptions?: VariableFromName | VariableOptions,
): Variable {
  const options = typeof nameOrOptions === 'string' || isFunction(nameOrOptions) || hasProperty(nameOrOptions, 'kind', value => value === 'variable-name')
    ? { name: isFunction(nameOrOptions) ? nameOrOptions(source.name) : nameOrOptions as string | VariableName }
    : nameOrOptions ?? {}
  return createVariable(input, options, source)
}

/**
 * 创建与派生共用参数解析和内容协议；来源仅在创建时复制，不建立动态配置继承。
 */
function createVariable(input: VariableDefaultValue | VariableStateValues, options: string | VariableOptions, source?: Variable): Variable {
  const config = parseVariableArgs(input as VariableDefaultValue, options, source)
  const name = config.name
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
    variant(variantName) {
      assert(self.config.variants && Object.hasOwn(self.config.variants, variantName), `Variable ${name} 未定义变体 ${variantName}。`)
      const rule = self.config.variants[variantName]
      const source = self.config.resultSource
      const result = source && isVariable(source)
        ? transformVariable(source.variant(variantName), self.config.resultSourceTransform!, `${name}-${variantName}`)
        : variableFrom(self, isFunction(rule) && !isJSSContent(rule) ? rule(self.content) : rule, `${name}-${variantName}`)
      delete result.config.variants
      if (source) result.config.resourceSource = self.config.resourceSource ?? source
      let selections = variantSelections.get(self)
      if (!selections) variantSelections.set(self, selections = new Set())
      selections.add(result)
      return result
    },
    /**
     * 注册时绑定的名称引用，不支持后续替换。
     */
    get name() { return name },
    config: {
      address: config.address ?? ':where(:root)',
      resultTransforms: [...source?.resultTransforms ?? []],
      defaultValue: config.defaultValue,
      states,
      variants: config.variants,
      registration: config.registration,
      get definitionKey() {
        return { toCSSString: self.toCSSString, priority: self.priority, join: joinVariableValues }
      },
    },
    /**
     * 返回绑定名称的 CSS 声明地址。
     */
    toCSSString() {
      return getVariableNameAddress(name)
    },
    get key() { return self.config.definitionKey },
    get join() { return joinVariableValues },
    get content() { return self.config.defaultValue },
    get address() { return self.config.address },
    get resultTransforms() { return self.config.resultTransforms },
    get states() { return self.config.states },
    get registration() { return self.config.registration },
    /**
     * 声明目标与值引用消费当前对象的同一份定义材料。
     */
    onCompile(context, controller) {
      controller.setContent(context, context.role === 'declaration-key'
        ? createJSSContent(self.toCSSString, [definitionContent])
        : createJSSContent(() => `var(${self.toCSSString()})`, [definitionContent]))
    },
  }
  // 同一份定义材料供当前对象引用和声明键消费，默认、状态仍从 self 读取。
  const definitionContent: JSSContent = {
    compileWaveIndex: config.compileWaveIndex,
    /**
     * 消费当前定义的默认、状态及资源，不再次进入名称引用。
     */
    onCompile(context, controller) {
      const dependencies = consumeVariableDefinition(self, context, controller)
      const activation = variableActivations.get(self)
      if (activation) dependencies.push(activation)
      controller.setContent(context, { dependencies })
    },
  }
  if (config.onActive) variableActivations.set(self, { onActive: config.onActive })
  return self
}

/**
 * 识别具体 Variable 身份，不读取基础内容。
 */
export const isVariable = (input: unknown): input is Variable =>
  hasProperty(input, 'kind', (v) => v === 'variable')

/**
 * 将自定义属性材料作为内容引用；依赖原信息体，保留其资源激活关系。
 */
export function referenceVariable(target: VariableTarget): JSSContent & JSSKeyObject {
  if (isVariable(target)) return target
  const reference: JSSContent & JSSKeyObject = {
    dependencies: isJSSContent(target) ? [target] : [],
    /**
     * 作为声明目标时输出材料的当前 CSS 名称。
     */
    toCSSString: () => propertyName(target.key),
    /**
     * 天然材料的值引用与声明复用定义消费，Variable 直接使用已有内容协议。
     */
    onCompile: (context, controller) => compileVariableContent(target, context, controller),
  }
  return reference
}

/**
 * 编译天然自定义属性材料的声明或值引用；定义副作用与 Variable 共用，值位置仅输出一次引用。
 */
export function compileVariableContent(target: VariableTarget, context: JSSCompileContext, controller: ASTController): void {
  const dependencies = consumeVariableDefinition(target, context, controller)
  if (context.role === 'declaration-key') return
  if (context.input !== target && isJSSContent(target)) dependencies.push(target)
  controller.setContent(context, createJSSContent(() => `var(${propertyName(target.key)})`, dependencies))
}

/**
 * 激活定义所需的共同声明与注册资源，记录实际默认配方并交付结构化依赖；不生成值引用。
 */
function consumeVariableDefinition(target: VariableTarget, context: JSSCompileContext, controller: ASTController): unknown[] {
  const resources: JSSContent[] = []
  const resourceSource = isVariable(target) && target.config.resourceSource
  if (resourceSource) {
    let activation = adjustmentActivations.get(resourceSource)
    if (!activation) {
      let top = variableActivations.get(resourceSource)
      if (!top && resourceSource.onActive) {
        top = { onActive: resourceSource.onActive }
        variableActivations.set(resourceSource, top)
      }
      activation = {
        dependencies: top ? [top] : [],
        onCompile(context, controller) { activateVariableResources(resourceSource, context, controller) },
      }
      adjustmentActivations.set(resourceSource, activation)
    }
    resources.push(activation)
  }
  for (const dependency of target.declarations ?? []) {
    consumeDeclaration(context, controller, dependency)
  }
  activateVariableResources(target, context, controller)
  if (context.role === 'declaration-key') {
    if (context.node.key === target && !declaredVariable(context.node)
      && (context.node.content as { kind?: string } | undefined)?.kind !== 'variable-modification') {
      context.node.content = declareVariable(target, context.node.content as ValueInput)[1]
    }
    return resources
  }
  consumeDeclaration(context, controller, target)
  return resources
}
/** 同一对象的激活期消费者；资源被同名对象替换后，旧对象的重复引用不重新覆盖注册。 */
const registrationSessions = new WeakMap<object, Map<VariableTarget, Map<JSSStyleNode, Set<unknown>>>>()

/**
 * 按 registration 登记 CSS @property；对象首次消费时替换同址资源，全部消费者撤销后可再次激活。
 */
function activateVariableResources(variable: VariableTarget, context: JSSCompileContext, controller: ASTController): void {
  const registration = variable.registration
  if (!registration) return
  const address = `variable-registration:${propertyName(variable.key)}`
  let registrations = registrationSessions.get(context.session)
  if (!registrations) registrationSessions.set(context.session, registrations = new Map())
  const active = registrations.has(variable)
  const consumers = mapGet(registrations, variable, () => new Map<JSSStyleNode, Set<unknown>>())
  if (!consumers.has(context.node)) {
    const inputs = new Set<unknown>()
    consumers.set(context.node, inputs)
    let consuming = true
    const release = () => {
      if (!consuming) return
      consuming = false
      consumers.delete(context.node)
      if (!consumers.size) registrations.delete(variable)
      for (const node of controller.search({ resourceAddress: address, productTag: variable }))
        controller.release(node, { owner: context.node })
    }
    controller.onRemove(context.node, release)
    controller.addSettlementCheck(() => {
      if (!consuming) return false
      for (const input of inputs) if (!controller.usesContent(context.node, input)) inputs.delete(input)
      if (inputs.size) return false
      release()
      return true
    })
  }
  consumers.get(context.node)!.add(context.input)
  if (active) {
    for (const node of controller.search({ resourceAddress: address, productTag: variable })) controller.depend(node, { owner: context.node })
    return
  }
  for (const node of controller.search({ resourceAddress: address })) controller.remove(node)
  const registrationPath = {
    targetConditionPath: [condition(`@property ${propertyName(variable.key)}`)],
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
  assert(typeof registration.syntax === 'string', 'Variable registration.syntax 必须是字符串。')
  assert(typeof registration.inherits === 'boolean', 'Variable registration.inherits 必须是 boolean。')
  const declarations: [key: string, content: ValueInput][] = [
    ['syntax', JSON.stringify(registration.syntax)],
    ['inherits', String(registration.inherits)],
  ]
  if (registration.initialValue !== undefined) declarations.push(['initial-value', registration.initialValue])
  return declarations
}
