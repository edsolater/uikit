/** 样式中 Variable 的定义与消费主体。

创建和引用变量，保存默认值、状态与变体，并支持独立声明、调整绑定及条件修改。

默认值、状态与变体由同一份创建配置保存，具体输出由样式中的使用位置决定。
*/
import { condition } from '../condition'
import type { JSSStyleNode } from '../compiler/rules-to-style-nodes'
import { propertyName, type JSSKeyObject } from '../key'
import { createJSSContent, isJSSContent, type JSSCompileContext, type JSSContent } from '../content'
import type { ASTController } from '../compiler/ast-controller'
import type { ValueInput } from '../value'
import { resolveStateConditions, type StateCondition } from '../pieces/state-conditions'
import { assert, hasProperty, isFunction, mapGet } from '@edsolater/fnkit'
import { consumeDeclaration, findVariableDeclaration, joinVariableValues } from './declare'
import { declare, type DeclareProtocol } from '../operations/declare'
import { parseVariableArgs, type VariableStateValues } from './args-parser'
import { observeVariable } from './dependency'
import { getVariableNameAddress, type VariableName } from './name'

/** 未命中状态时的声明内容；生产函数消费时无参执行。 */
export type VariableDefaultValue = ValueInput
/** 状态配方中的 base 是本次声明的基础内容，不是同名变量引用。 */
export type VariableStateRule = ValueInput | ((base: ValueInput) => ValueInput)
/** 变体以默认表达式生成新基础；固定值原样保留。 */
export type VariableVariantRule = ValueInput | ((base: ValueInput) => ValueInput)

/** 自定义属性材料；状态与注册仅在材料实际持有时参与。 */
export interface VariableTarget extends DeclareProtocol, JSSContent {
  states?: Map<StateCondition, VariableStateRule>
  registration?: VariableOptions['registration']
}

/** 样式中的可复用变量，可读取内容，也可建立局部基础值并继续修改。 */
export interface Variable extends VariableTarget, JSSKeyObject {
  kind: 'variable'
  get name(): VariableName
  priority: number
  /** 创建时原样复用状态与变体定义，随后差异只属于新定义。 */
  derive(): Variable
  derive(input: VariableDefaultValue | VariableStateValues, nameOrOptions?: VariableDeriveName | VariableOptions): Variable
  /** 选择变体，以新默认值生成保留状态的 Variable；结果不携带来源的变体定义。 */
  variant(name: string): Variable
  /** 这一个 Variable 的基础内容、状态、变体和可选行为。 */
  config: {
    /** 未命中状态时使用的内容；生产函数在消费时求值。 */
    defaultValue: VariableDefaultValue
    /** 条件按登记顺序保存，原始规则在每次声明时绑定当地基础内容。 */
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
  /** 独立 Name 或创建 Name 的字符串简写；字符串可带 --，derive 可沿用来源身份。 */
  name?: string | VariableName
  /** 声明键等级；普通创建默认0，继承默认来源等级加一，显式0仍生效。 */
  priority?: number
  /**
   * 各 State Condition 下使用的基础内容；修改从选中的基础内容继续。
   * 回调在声明展开时执行，收到本次声明基础内容；derive 保留规则并重新绑定。
   */
  states?: Record<string, VariableStateRule>
  /** 变体规则或固定基础；derive 按名称继承，显式同名项覆盖。 */
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
export type VariableDeriveName = string | VariableName | ((name: VariableName) => string | VariableName)

/**
 * Variable，样式中的基本复用变量；默认值生产函数在编译消费时求值，状态规则随每次声明绑定。
 * 默认值也可写成 { default, ...states }，名称也可直接传字符串；两处简写可独立使用。
 * 普通创建必须提供默认内容及名称；derive 可继承这两项。
 */
export function variable<DefaultValue extends VariableDefaultValue>(
  input: DefaultValue | VariableStateValues<DefaultValue>,
  options: string | (VariableOptions & { name: string | VariableName }),
): Variable {
  return createVariable(input, options)
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
    /**
     * 以当前配置派生独立定义；默认内容、名称及未覆盖的状态与变体沿用来源。
     */
    derive(input?: VariableDefaultValue | VariableStateValues, naming?: VariableDeriveName | VariableOptions) {
      const targetOptions = typeof naming === 'string' || isFunction(naming) || hasProperty(naming, 'kind', value => value === 'variable-name')
          ? { name: isFunction(naming) ? naming(self.name) : naming as string | VariableName }
          : naming ?? {}
      return createVariable(arguments.length === 0 ? self.config.defaultValue : input, targetOptions, self)
    },
    variant(variantName) {
      assert(self.config.variants && Object.hasOwn(self.config.variants, variantName), `Variable ${name} 未定义变体 ${variantName}。`)
      const rule = self.config.variants[variantName]
      const content = isFunction(rule) && !isJSSContent(rule) ? rule(self.content) : rule
      const result = self.derive(content, `${name}-${variantName}`)
      delete result.config.variants
      return result
    },
    /**
     * 注册时绑定的名称引用，不支持后续替换。
     */
    get name() { return name },
    config: {
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
    onActive: config.onActive,
    compileWaveIndex: config.compileWaveIndex,
    /**
     * 消费当前定义的默认、状态及资源，不再次进入名称引用。
     */
    onCompile(context, controller) {
      controller.setContent(context, { dependencies: consumeVariableDefinition(self, context, controller) })
    },
  }
  return self
}

/**
 * 识别具体 Variable 身份，不读取基础内容。
 */
export const isVariable = (input: unknown): input is Variable =>
  hasProperty(input, 'kind', (v) => v === 'variable')

/** 天然材料引用保留其原对象身份，不按CSS名称猜测所属定义。 */
const referenceTargets = new WeakMap<object, VariableTarget>()

/**
 * 读取内容中的具体引用对象；这里只交付创建引用时已知的身份，不执行材料内容。
 */
export function referencedVariable(input: object): VariableTarget | undefined {
  return isVariable(input) ? input : referenceTargets.get(input)
}

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
  referenceTargets.set(reference, target)
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
  for (const dependency of target.declarations ?? []) {
    const existing = findVariableDeclaration(controller, dependency, context.conditionPath)
    if (existing) controller.depend(existing, { owner: context.node })
    else controller.insert({ before: context.node, conditionPath: context.conditionPath }, declare(dependency), { owner: context.node })
  }
  activateVariableResources(target, context, controller)
  if (context.role === 'declaration-key') {
    // 独立声明也启动统一稳定核验；键访问不登记值消费。
    observeVariable(target, undefined, context, controller)
    return []
  }
  const definition = consumeDeclaration(context, controller, target)
  const content = definition ? definition.baseContent : target.content
  observeVariable(target, content, context, controller, definition?.baseNode, definition?.originNode)
  return definition ? [] : [content]
}
/** 同一对象的激活期消费者；资源被同名对象替换后，旧对象的重复引用不重新覆盖注册。 */
const registrationSessions = new WeakMap<object, Map<VariableTarget, Set<JSSStyleNode>>>()

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
