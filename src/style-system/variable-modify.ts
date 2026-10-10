/** 局部 Variable 声明与相对修改的 CSS 生成器。

为每个局部声明生成基础值和状态值，再把归属它的修改接成最终 CSS 值。

样式节点增删后，修改仍须按当前归属与顺序从基础值继续计算。
*/
import { createJSSContent, isJSSContent, type Expression, type JSSCompileContext, type JSSContent } from './content'
import { resolveVariable } from './variable-cluster'
import { assert, check, containKey, hasMethod, hasProperty, isArray, isFunction, isMap, isNumber, isString, isUndefined, mapGet, matchShape, optional, or, result, type DataShape } from '@edsolater/fnkit'
import { condition, conditionAddressKey, isSemanticPathPrefix, semanticPathParts, type ConditionPath } from './condition'
import type { Declaration, DeclareProtocol } from './declaration'
import type { JSSStyleNode } from './compiler/rules-to-style-nodes'
import type { JSSKeyObject } from './key'
import type { ASTController } from './compiler/ast-controller'
import { value, type Value, type ValueInput } from './value'
import { appendStateCondition } from './pieces/state-conditions'
import { referenceVariable, variableRegistrationDeclarations, type VariableDefaultValue, type VariableOptions } from './variable'
import { colorModificationShape, type ColorModificationContent } from './modification'
import { relativeOKLCH } from './pieces/contents/functions/relative-oklch'

/** 修改方交付的领域材料；各 type 的参数由其实际应用定义。 */
export type ModifyProtocol = Parameters<(typeof modifyTypes)[keyof typeof modifyTypes]['apply']>[1]

/** 可修改自定义属性的基础材料；状态和注册仅在存在时参与，不要求对象实现操作。 */
export interface ModifyTargetProtocol extends DeclareProtocol, JSSContent {
  states?: Map<import('./pieces/state-conditions').StateCondition, ValueInput>
  registration?: VariableOptions['registration']
}

/** 操作所需的自定义属性材料；继承字段和可调用对象按 FNKit 形状读取。 */
export const modifyTargetShape = {
  key: check(hasMethod, 'toCSSString', {
    resultIs: [isString, name => /^--.+/.test(name as string)],
  }),
  content: or(isString, isNumber, isUndefined, isFunction, isJSSContent),
  states: optional(isMap),
  declarations: optional(isArray),
} satisfies DataShape

/**
 * 返回条件修改 Declaration；按 type 选择应用，编译消费时生成前序 Expression 的修改结果。
 * 修改归属最近的同对象声明；颜色材料保留配方 CSS 引用，生效条件由 CSS 决定。
 * 相同 id 在同一局部声明内共用一步；未指定 id 时每次调用形成独立步骤。
 * @example
 * rules('.button', [declare(surfaceColor, baseColor)])
 * rules(['.button', '&:hover'], [modify(surfaceColor, hoverChange)])
 */
export function modify(variable: ModifyTargetProtocol, modification: ModifyProtocol, options?: { id?: string | symbol }): Declaration {
  assert(hasProperty(variable, 'content') && matchShape(variable, modifyTargetShape), 'modify 需要自定义属性的 key/content 材料。')
  const strategy = hasProperty(modification, 'type', isString) && Object.hasOwn(modifyTypes, modification.type) ? modifyTypes[modification.type] : undefined
  assert(strategy && strategy.accepts(modification), 'modify 需要颜色配方或表达变化材料。')
  variable = resolveVariable(variable)
  return [variable.key, {
    resourceIdentity: Symbol('variable-modification'),
    /**
     * 按最近声明及书写顺序发布当前修改，维护消费链和撤销关系。
     */
    onCompile(context, controller) {
      const target = findVariableDeclaration(controller, variable, context.conditionPath)
      if (!target) { controller.defer(context.node, `自定义属性 ${variable.key.toCSSString()} 的修改找不到父路径定义。`); return }
      const session = sessionOf(context)
      const instance = ensureVariableInstance(context, controller, target)
      const old = session.steps.get(context.node)
      if (old?.instance === instance) { refreshSteps(controller, instance); return }
      if (old) removeModification(context, controller, old, context.node)
      if (!instance.steps.length) {
        instance.baseName = `${variable.key.toCSSString().slice(2)}-modify-${instance.number}-base`
        publishResult(controller, instance, instance.node)
        const alias = instance.results.get(conditionAddressKey(instance.node.conditionPath))!.alias!
        registerInternalVariable(controller, instance, instance.baseName, alias)
      }
      const step = instance.steps.find(step => options?.id !== undefined && step.id === options.id)
        ?? createStep(context, controller, instance, options?.id)
      const output = (strategy.apply as (current: Expression, change: ModifyProtocol) => Expression)(step.currentExpression, modification)
      const gate = `${step.name}-candidate-${++step.count}`
      const selection = controller.insert({ before: context.node, conditionPath: context.conditionPath },
        [undefined, createJSSContent(resolve => resolve(output) === undefined ? undefined : selectionText(step, gate), [output])],
        { owner: context.node, identity: 'modification' })
      step.members.set(context.node, { gate, output, selection })
      session.steps.set(context.node, step)
      publishResult(controller, instance, context.node)
      refreshSteps(controller, instance, step)
      controller.onRemove(context.node, () => {
        const current = session.steps.get(context.node)
        if (current) removeModification(context, controller, current, context.node)
      })
    },
  }]
}

/** 一个局部声明的基础值、最终值和修改步骤；只在本次编译内有效。 */
interface VariableInstance {
  node: JSSStyleNode
  variable: ModifyTargetProtocol
  number: number
  count: number
  baseName: string
  baseKey: JSSKeyObject
  /** 同一 ID 的修改共用一步，作用范围限于此局部声明。 */
  steps: VariableStep[]
  results: Map<string, VariableResult>
}

/**
 * 局部 Variable 同址赋值保留最后一个实际输出的值。
 */
const joinVariableValues = (values: Value[]): ValueInput =>
  value(values, {
    /**
     * 忽略没有输出的贡献，返回本地址最后有效的声明值。
     */
    toCSSString: (items, resolve) => items.map(resolve).findLast(output => output !== undefined),
  })

/** 一个消费地址的本地结果链；同址消费者共享，条件与继承交给 CSS。 */
interface VariableResult {
  path: ConditionPath
  members: Set<JSSStyleNode>
  alias?: JSSStyleNode
}
/** 一步修改的候选规则及 CSS 选择门；共享 ID 由原选择器层叠决定候选。 */
interface VariableStep {
  instance: VariableInstance
  name: string
  anchor: JSSStyleNode
  fallback: JSSStyleNode
  members: Map<JSSStyleNode, { gate: string; output: Expression; selection: JSSStyleNode }>
  currentExpression: Expression
  count: number
  id?: string | symbol
}
/** 局部声明显式携带目标与内容，不另建隐藏身份表。 */
interface VariableDeclaration extends JSSContent {
  kind: 'variable-declaration'
  variable: ModifyTargetProtocol
  content: VariableDefaultValue
}
/**
 * 识别显式局部声明；其他内容不参与局部归属。
 */
const isVariableDeclaration = (input: unknown): input is VariableDeclaration =>
  containKey(input, 'kind') && input.kind === 'variable-declaration'
const variableSessions = new WeakMap<object, VariableSession>()
/** 本次编译中，各声明和修改节点所属的局部实例与步骤。 */
interface VariableSession {
  instances: WeakMap<JSSStyleNode, VariableInstance>
  steps: WeakMap<JSSStyleNode, VariableStep>
  consumers: WeakMap<JSSStyleNode, Map<ModifyTargetProtocol, VariableInstance>>
  nextNumber: number
}
/**
 * 取得本次编译的声明与修改状态；首次访问时建立，编译之间互不影响。
 */
function sessionOf(context: JSSCompileContext): VariableSession {
  let session = variableSessions.get(context.session)
  if (!session) {
    session = { instances: new WeakMap(), steps: new WeakMap(), consumers: new WeakMap(), nextNumber: 0 }
    variableSessions.set(context.session, session)
  }
  return session
}
/**
 * 识别局部声明所用的 Variable；其他样式节点返回 undefined。
 */
const declaredVariable = (node: JSSStyleNode): ModifyTargetProtocol | undefined =>
  isVariableDeclaration(node.content) ? node.content.variable : undefined
/**
 * 取得语义父链上最近的同对象基础声明；同 Key 的修改和普通赋值不视为局部定义。
 */
export const findVariableDeclaration = (controller: ASTController, variable: ModifyTargetProtocol, path: ConditionPath): (JSSStyleNode & { content: VariableDeclaration }) | undefined =>
  controller.search({ key: variable.key })
    .filter((node): node is JSSStyleNode & { content: VariableDeclaration } => declaredVariable(node) === variable && isSemanticPathPrefix(node.conditionPath, path))
    .sort((left, right) => semanticPathParts(right.conditionPath).length - semanticPathParts(left.conditionPath).length)[0]

/**
 * 找到状态内容应写入的局部基础值，返回其 Key；没有局部声明则返回 undefined。
 * 该局部实例尚未建立时，会同时生成基础值和状态值。
 */
export function findLocalBaseKey(
  context: JSSCompileContext,
  controller: ASTController,
  variable: ModifyTargetProtocol,
  path: ConditionPath,
): JSSKeyObject | undefined {
  const target = findVariableDeclaration(controller, variable, path)
  return target ? ensureVariableInstance(context, controller, target).baseKey : undefined
}

/**
 * 为 Variable 创建局部基础值声明；返回的声明在编译消费时生成基础值，并接管归属它的已有修改。
 */
export function declareVariable(
  variable: ModifyTargetProtocol,
  value: VariableDefaultValue,
): Declaration {
  variable = resolveVariable(variable)
  const content: VariableDeclaration = {
    kind: 'variable-declaration', variable, content: value,
    resourceIdentity: Symbol('variable-declaration'),
    /**
     * 建立本地基础实例，并让已有消费和修改重新确认最近的声明归属。
     */
    onCompile(context, controller) {
      ensureVariableInstance(context, controller, context.node)
      // 新局部定义接管已有修改时，重新确定这些修改的归属。
      const session = sessionOf(context)
      for (const node of controller.nodes()) {
        const previous = session.steps.get(node)?.instance ?? session.consumers.get(node)?.get(variable)
        if (previous && previous !== session.instances.get(context.node) && findVariableDeclaration(controller, variable, node.conditionPath) === context.node)
          node.compileRevision++
      }
    },
  }
  return [referenceVariable(variable), content]
}

/**
 * 为局部声明生成基础值及各状态值，并取得这次编译中的修改归属；同一语义路径重复声明会报错。
 */
function ensureVariableInstance(context: JSSCompileContext, controller: ASTController, node: JSSStyleNode): VariableInstance {
  const session = sessionOf(context)
  const existing = session.instances.get(node)
  if (existing) return existing
  assert(isVariableDeclaration(node.content), '局部 Variable 实例需要 Variable 声明。')
  const { variable, content } = node.content
  const address = JSON.stringify(semanticPathParts(node.conditionPath))
  assert(
    !controller.search({ key: variable.key }).some(other => other !== node && declaredVariable(other) === variable && JSON.stringify(semanticPathParts(other.conditionPath)) === address),
    `自定义属性 ${variable.key.toCSSString()} 在同一语义路径重复定义。`,
  )
  const instance: VariableInstance = {
    node,
    variable,
    number: ++session.nextNumber,
    count: 0,
    baseName: variable.key.toCSSString().slice(2),
    baseKey: {
      /**
       * 基础目标随修改链的基础名称变更。
       */
      toCSSString: () => `--${instance.baseName}`,
      join: joinVariableValues,
    },
    steps: [],
    results: new Map(),
  }
  session.instances.set(node, instance)
  declareInstanceValues(controller, instance, content)
  takeOverAutomaticStates(controller, instance)
  controller.onRemove(node, () => {
    for (const consumer of controller.nodes())
      if (session.steps.get(consumer)?.instance === instance || session.consumers.get(consumer)?.get(variable) === instance)
        consumer.compileRevision++
  })
  return instance
}

/**
 * 求基础生产函数并发布基础值与有序状态值。
 */
function declareInstanceValues(controller: ASTController, instance: VariableInstance, content: VariableDefaultValue): void {
  const { node, variable } = instance
  controller.insert(
    { before: node, conditionPath: node.conditionPath },
    [instance.baseKey, result(content)],
    { owner: node, identity: 'base' },
  )
  for (const [state, stateContent] of variable.states ?? []) {
    const stateNode = controller.insert(
      {
        before: node,
        conditionPath: appendStateCondition(node.conditionPath, state),
      },
      [instance.baseKey, stateContent],
      { owner: node, identity: `state/${state.name}` },
    )
    stateNode.readState = state.name
  }
}

/**
 * 局部声明接管同对象已生成的自动状态值，避免它们覆盖此声明的基础值和状态。
 */
function takeOverAutomaticStates(controller: ASTController, instance: VariableInstance): void {
  const { node, variable } = instance
  for (const candidate of controller.search({ productTag: variable })) {
    if (
      candidate.resourceAddress === undefined && findVariableDeclaration(controller, variable, candidate.conditionPath) === node
    ) {
      controller.remove(candidate)
    }
  }
}

/**
 * 在普通引用地址求完整修改链，允许子元素覆盖颜色配方后当地应用。
 */
export function consumeVariable(context: JSSCompileContext, controller: ASTController, variable: ModifyTargetProtocol): void {
  const target = findVariableDeclaration(controller, variable, context.conditionPath)
  if (!target) return
  const instance = ensureVariableInstance(context, controller, target)
  const session = sessionOf(context)
  let consumers = session.consumers.get(context.node)
  if (!consumers) session.consumers.set(context.node, consumers = new Map())
  const previous = consumers.get(variable)
  if (previous === instance) return
  if (previous) releaseResult(controller, previous, context.node)
  consumers.set(variable, instance)
  publishResult(controller, instance, context.node)
  controller.onRemove(context.node, () => {
    if (consumers.get(variable) === instance) { consumers.delete(variable); releaseResult(controller, instance, context.node) }
  })
}

/**
 * 输出当前步骤的候选选择声明；空 token 关闭候选，initial 使 var() 使用对应表达式。
 */
const selectionText = (step: VariableStep, selected = `${step.name}-identity`): string =>
  [`${step.name}-identity`, ...[...step.members.values()].map(member => member.gate)]
    .map(name => `--${name}: ${name === selected ? 'initial' : ''};`).join('\n')
    + (step.instance.variable.registration?.inherits === false ? `\n--${step.name}-present: ;` : '')
/**
 * 建立引用前序结果的新修改阶段，未命中时沿用前序值。
 */
function createStep(context: JSSCompileContext, controller: ASTController, instance: VariableInstance, id?: string | symbol): VariableStep {
  const name = `${instance.variable.key.toCSSString().slice(2)}-modify-${instance.number}-step-${++instance.count}`
  const currentExpression = createJSSContent(() => {
    const index = instance.steps.indexOf(step)
    return stageReference(instance, instance.steps[index - 1]?.name)
  })
  const fallback = controller.insert({ before: context.node, conditionPath: instance.node.conditionPath },
    [undefined, createJSSContent(() => selectionText(step))], { owner: instance.node, identity: `${name}/default` })
  const step: VariableStep = { instance, name, anchor: context.node, fallback, currentExpression,
    members: new Map(), count: 0, id }
  registerInternalVariable(controller, instance, name, fallback)
  if (instance.variable.registration?.inherits === false)
    registerInternalVariable(controller, instance, `${name}-present`, fallback, { syntax: '*', inherits: false })
  instance.steps.push(step)
  return step
}
/**
 * 为当前消费地址发布共享结果链；默认引用保留该地址已有的手写公开赋值。
 */
function publishResult(controller: ASTController, instance: VariableInstance, member: JSSStyleNode): void {
  const address = conditionAddressKey(member.conditionPath)
  const existing = instance.results.has(address)
  const result = mapGet(instance.results, address, () => ({ path: member.conditionPath, members: new Set<JSSStyleNode>() }))
  result.members.add(member)
  if (!result.alias && (instance.baseName !== instance.variable.key.toCSSString().slice(2) || instance.steps.length)) {
    const manual = controller.search({ key: instance.variable.key, conditionPath: result.path })
      .some(node => node !== instance.node && !declaredVariable(node) && !instance.steps.some(step => step.members.has(node)) && node.content !== member.content)
    if (!manual || member === instance.node) result.alias = controller.insert({ before: member, conditionPath: result.path },
      [{
        /**
         * 发布当前目标名称，聚合保留最后一个有效局部结果。
         */
        toCSSString: () => instance.variable.key.toCSSString(), join: joinVariableValues },
        createJSSContent(() => stageReference(instance, instance.steps.at(-1)?.name))],
      { owner: instance.node, identity: `result/${address}`, productTag: instance })
  }
  if (!existing) for (const step of instance.steps) publishStep(controller, step, result)
}
/**
 * 返回阶段值引用；不继承注册的阶段缺少本地规则时使用其基础值。
 */
function stageReference(instance: VariableInstance, name = instance.baseName): string {
  const fallback = name !== instance.baseName && instance.variable.registration?.inherits === false
    ? `, var(--${instance.baseName})` : ''
  return `var(--${name}${fallback})`
}
/**
 * 在消费地址发布当前步骤表达式；祖先传递候选选择，局部覆盖的依赖在当地重新计算。
 */
function publishStep(controller: ASTController, step: VariableStep, result: VariableResult): void {
  const key = {
    /**
     * 当前步骤的结果目标，归属于同一局部修改链。
     */
    toCSSString: () => `--${step.name}`, join: joinVariableValues }
  for (const old of controller.search({ key, conditionPath: result.path, productTag: step.instance })) controller.remove(old)
  const expression = createJSSContent(resolve => {
    const branches = [`var(--${step.name}-identity, ${resolve(step.currentExpression)})`]
    for (const member of step.members.values()) {
      const output = resolve(member.output)
      if (output !== undefined) branches.push(`var(--${member.gate}, ${output})`)
    }
    const presence = step.instance.variable.registration?.inherits === false ? `var(--${step.name}-present) ` : ''
    return presence + branches.join(' ')
  }, [step.currentExpression, ...[...step.members.values()].map(member => member.output)])
  const anchor = result.alias ?? [...result.members][0]
  controller.insert({ before: anchor, conditionPath: result.path }, [key, expression],
    { owner: result.alias ?? step.instance.node, identity: `${step.name}/result`, productTag: step.instance })
}
/**
 * 按样式书写顺序更新修改链；已有引用随步骤顺序变化，新候选更新自身阶段输出。
 */
function refreshSteps(controller: ASTController, instance: VariableInstance, changed?: VariableStep): void {
  if (!controller.nodes().includes(instance.node)) return
  const nodes = controller.search({ key: instance.variable.key })
  for (const step of instance.steps) step.anchor = nodes.find(node => step.members.has(node)) ?? step.anchor
  instance.steps.sort((left, right) => nodes.indexOf(left.anchor) - nodes.indexOf(right.anchor))
  for (const step of instance.steps) {
    for (const [member, candidate] of step.members) controller.move(candidate.selection, { before: member })
    controller.move(step.fallback, { before: step.members.get(step.anchor)!.selection })
    for (const result of instance.results.values()) if (changed === step) publishStep(controller, step, result)
  }
  for (const result of instance.results.values()) {
    if (!result.alias) publishResult(controller, instance, [...result.members][0])
  }
}
/**
 * 撤销当前消费者；同址还有消费者时保留结果，否则撤销该地址的阶段及依赖。
 */
function releaseResult(controller: ASTController, instance: VariableInstance, member: JSSStyleNode): void {
  const address = conditionAddressKey(member.conditionPath)
  const result = instance.results.get(address)
  if (!result) return
  result.members.delete(member)
  if (result.members.size) return
  if (result.alias) controller.remove(result.alias)
  for (const output of controller.search({ conditionPath: result.path, productTag: instance })) controller.remove(output)
  instance.results.delete(address)
}
/**
 * 撤销一次修改并更新后续结果；阶段没有候选时同时撤销它的选择声明和注册资源。
 */
function removeModification(context: JSSCompileContext, controller: ASTController, step: VariableStep, node: JSSStyleNode): void {
  const candidate = step.members.get(node)
  step.members.delete(node)
  sessionOf(context).steps.delete(node)
  if (candidate) controller.remove(candidate.selection)
  releaseResult(controller, step.instance, node)
  if (!step.members.size) {
    step.instance.steps.splice(step.instance.steps.indexOf(step), 1)
    for (const output of controller.search({ key: `--${step.name}`, productTag: step.instance })) controller.remove(output)
    controller.remove(step.fallback)
  }
  if (step.instance.steps.length) refreshSteps(controller, step.instance, step)
  else {
    for (const result of step.instance.results.values()) if (result.alias) { controller.remove(result.alias); delete result.alias }
    step.instance.baseName = step.instance.variable.key.toCSSString().slice(2)
  }
}
/**
 * 将公开 Variable 的 @property 约束应用到修改用的内部变量；未配置时不生成注册。
 */
function registerInternalVariable(controller: ASTController, instance: VariableInstance, name: string, owner: JSSStyleNode, registration = instance.variable.registration): void {
  if (!registration) return
  const path: ConditionPath = { targetConditionPath: [condition(`@property --${name}`)], stateConditionPath: [] }
  const provenance = { owner }
  const position = { before: instance.node, conditionPath: path }
  variableRegistrationDeclarations(registration).forEach(([key, content]) =>
    controller.insert(position, [key, content], { ...provenance, identity: `${name}/${key === 'initial-value' ? 'initial' : key}` }),
  )
}


/** 任意 CSS 表达变化的描述；回调由 Modify 使用端应用，不承诺可独立声明。 */
export interface ExpressionModification {
  type: 'expression'
  detail: (currentExpression: Expression) => Expression
}

/** 各领域的材料检查及前序表达式应用；不介入通用步骤、归属和撤销。 */
const modifyTypes = {
  color: {
    /**
     * 识别可独立声明的颜色配方，保持模块循环中的材料延迟读取。
     */
    accepts: (change: unknown) => hasProperty(change, 'content') && matchShape(change, colorModificationShape),
    /**
     * 以独立颜色配方的 CSS 引用改变前序结果。
     */
    apply: (current: Expression, change: ColorModificationContent) => relativeOKLCH(current, referenceVariable(change)),
  },
  expression: {
    /**
     * 识别持有表达式变化回调的材料。
     */
    accepts: (change: unknown) => hasProperty(change, 'detail', isFunction),
    /**
     * 将前序表达式交给变化回调，保留它返回的内容与依赖。
     */
    apply: (current: Expression, change: ExpressionModification) => change.detail(current),
  },
}
