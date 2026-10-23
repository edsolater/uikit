import { variantSelections } from './variant-selections'
import { mapGet } from '@edsolater/fnkit'
import { condition, conditionAddressKey, type ConditionPath } from '../condition'
import { createJSSContent, type Expression, type JSSCompileContext } from '../content'
import { keyPriority } from '../key'
import { variableRegistrationDeclarations, type VariableTarget } from './core'
import { automaticVariableDeclaration, consumeDeclaration, declaredVariable, joinVariableValues, variableDefinition, variableHomePath, variableProductRoles, type VariableDefinition } from './declare'
import type { ASTController, JSSStyleNode } from '../compiler/contracts'

/** Variable 根据地定义的完整结果修改链。
 *
 * 消费已选应用，维护实例、步骤、当地结果及撤销。
 *
 * 操作材料不持有 AST 生命周期，修改链在编译会话中按声明归属连接。
 */

/**
 * 按根据地的有效声明及书写顺序应用修改，维护消费链和撤销关系。
 */
export function compileVariableModification(context: JSSCompileContext, controller: ASTController, variable: VariableTarget,
  apply: (current: Expression) => Expression, id?: string | symbol, selectedDefinition?: VariableDefinition): void {
  variableProductRoles.set(context.node, 'control')
  const definition = selectedDefinition ?? consumeDeclaration(context, controller, variable)
  const old = steps.get(context.node)
  // 同址后写的显式声明是新的绑定，先前修改不能越过它；子条件修改仍由 CSS 匹配。
  if (definition.node.productTag !== automaticVariableDeclaration
    && conditionAddressKey(context.conditionPath) === conditionAddressKey(definition.path)
    && controller.compareOrder(context.node, definition.node) < 0) {
    if (old) removeModification(controller, old, context.node)
    variantModifications.get(context.node)?.()
    variantModifications.delete(context.node)
    return
  }
  const instance = ensureModifyInstance(context, controller, definition)
  const previous = old?.members.get(context.node)
  const invalidated = previous && (previous.input !== context.input || previous.revision !== context.node.compileRevision || old?.id !== id)
  if (invalidated) {
    variantModifications.get(context.node)?.()
    variantModifications.delete(context.node)
  }
  includeSelectedVariants(context, controller, variable, apply, id)
  if (old?.instance === instance && old.id === id) {
    if (invalidated) {
      previous.input = context.input
      previous.revision = context.node.compileRevision
      previous.output = apply(old.currentExpression)
      previous.selection.content = candidateSelection(old, previous.gate, previous.output)
    }
    refreshSteps(controller, instance, invalidated ? old : undefined)
    return
  }
  if (old) removeModification(controller, old, context.node)
  if (!instance.steps.length) {
    instance.definition.baseName = `${variable.key.toCSSString().slice(2)}-modify-${instance.number}-base`
    instance.definition.baseNode!.compileRevision++
    for (const state of instance.definition.stateProducts.values()) state.compileRevision++
    publishResult(controller, instance, instance.definition.node)
    const alias = instance.results.get(conditionAddressKey(instance.definition.node.conditionPath))!.alias!
    registerInternalVariable(controller, instance, instance.definition.baseName, alias)
  }
  const step = instance.steps.find(step => id !== undefined && step.id === id)
    ?? createStep(context, controller, instance, id)
  const output = apply(step.currentExpression)
  const gate = `${step.name}-candidate-${++step.count}`
  const selection = controller.insert({ before: context.node, conditionPath: context.conditionPath },
    [undefined, candidateSelection(step, gate, output)],
    { owner: context.node, identity: 'modification' })
  step.members.set(context.node, { gate, output, selection, input: context.input, revision: context.node.compileRevision })
  steps.set(context.node, step)
  publishResult(controller, instance, context.node)
  refreshSteps(controller, instance, step)
  for (const consumer of definition.consumers ?? []) publishResult(controller, instance, consumer)
  controller.onRemove(context.node, () => {
    const current = steps.get(context.node)
    if (current) removeModification(controller, current, context.node)
  })
}

const variantModifications = new WeakMap<JSSStyleNode, () => void>()
/** 显式修改包含实际使用的变体；不激活只选择但未消费的成员。 */
function includeSelectedVariants(context: JSSCompileContext, controller: ASTController, variable: VariableTarget,
  apply: (current: Expression) => Expression, id?: string | symbol): void {
  if (variantModifications.has(context.node)) return
  const products = new Map<string, { node: JSSStyleNode; definition: VariableDefinition }>()
  let active = true
  const cleanup = () => {
    active = false
    for (const product of products.values()) controller.remove(product.node)
    products.clear()
  }
  variantModifications.set(context.node, cleanup)
  controller.onRemove(context.node, cleanup)
  controller.addSettlementCheck(() => {
    if (!active) return false
    let changed = false
    const wanted = new Set<string>()
    for (const variant of variantSelections.get(variable) ?? []) {
      // 加工该 CSS 地址已经存在的有效绑定；不因 JS 对象不同忽略更高等级覆盖。
      const node = controller.findDeclaration({ key: variant.key, conditionPath: variableHomePath(variant) }, node =>
        !node.aggregate && variableDefinition(node) !== undefined)
      const definition = node && variableDefinition(node)
      if (!definition) continue
      const name = variant.toCSSString()
      wanted.add(name)
      const previous = products.get(name)
      if (previous?.definition === definition) continue
      if (previous) controller.remove(previous.node)
      const product = controller.insert({ after: context.node, conditionPath: context.conditionPath },
        [variant.key, { kind: 'variable-modification', onCompile(childContext, childController) {
          compileVariableModification(childContext, childController, variant, apply, id, definition)
        } }], { owner: context.node, initialize(node) { variableProductRoles.set(node, 'control') } })
      products.set(name, { node: product, definition })
      changed = true
    }
    for (const [name, product] of products) if (!wanted.has(name)) {
      controller.remove(product.node)
      products.delete(name)
      changed = true
    }
    return changed
  })
}

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
  members: Map<JSSStyleNode, { gate: string; output: Expression; selection: JSSStyleNode; input: unknown; revision: number }>
  currentExpression: Expression
  count: number
  id?: string | symbol
}
/** 仅已启用修改的声明拥有步骤实例。 */
interface VariableInstance {
  definition: VariableDefinition
  number: number
  count: number
  steps: VariableStep[]
  results: Map<string, VariableResult>
}
/** 声明和节点本身属于单次 AST，不再套第二层会话身份。 */
const instances = new WeakMap<VariableDefinition, VariableInstance>()
const steps = new WeakMap<JSSStyleNode, VariableStep>()
const counters = new WeakMap<object, number>()

/**
 * 首次修改才建立步骤状态；基础撤销精确清旧链，声明负责消费者重访。
 */
function ensureModifyInstance(context: JSSCompileContext, controller: ASTController, definition: VariableDefinition): VariableInstance {
  const existing = instances.get(definition)
  if (existing) return existing
  const number = (counters.get(context.session) ?? 0) + 1
  counters.set(context.session, number)
  const instance: VariableInstance = { definition, number, count: 0, steps: [], results: new Map() }
  instances.set(definition, instance)
  definition.onConsume = (node, active) => active ? publishResult(controller, instance, node) : releaseResult(controller, instance, node)
  controller.onRemove(definition.baseNode!, () => {
    for (const product of controller.search({ productTag: instance })) controller.remove(product)
    for (const step of instance.steps) {
      controller.remove(step.fallback)
      for (const [node, candidate] of step.members) { controller.remove(candidate.selection); node.compileRevision++ }
    }
  })
  return instance
}

/**
 * 输出当前步骤的候选选择声明；空 token 关闭候选，initial 使 var() 使用对应表达式。
 */
const selectionText = (step: VariableStep, selected = `${step.name}-identity`): string =>
  [`${step.name}-identity`, ...[...step.members.values()].map(member => member.gate)]
    .map(name => `--${name}: ${name === selected ? 'initial' : ''};`).join('\n')
    + (step.instance.definition.variable!.registration?.inherits === false ? `\n--${step.name}-present: ;` : '')

/** 更新同一候选的配方，不增加阶段或改变共享 ID 与源顺序。 */
const candidateSelection = (step: VariableStep, gate: string, output: Expression): Expression =>
  createJSSContent(resolve => resolve(output) === undefined ? undefined : selectionText(step, gate), [output])
/**
 * 建立引用前序结果的新修改阶段，未命中时沿用前序值。
 */
function createStep(context: JSSCompileContext, controller: ASTController, instance: VariableInstance, id?: string | symbol): VariableStep {
  const name = `${instance.definition.variable!.key.toCSSString().slice(2)}-modify-${instance.number}-step-${++instance.count}`
  const currentExpression = createJSSContent(() => {
    const index = instance.steps.indexOf(step)
    return stageReference(instance, instance.steps[index - 1]?.name)
  })
  const fallback = controller.insert({ before: context.node, conditionPath: instance.definition.node.conditionPath },
    [undefined, createJSSContent(() => selectionText(step))], { owner: instance.definition.node, identity: `${name}/default` })
  const step: VariableStep = { instance, name, anchor: context.node, fallback, currentExpression,
    members: new Map(), count: 0, id }
  registerInternalVariable(controller, instance, name, fallback)
  if (instance.definition.variable!.registration?.inherits === false)
    registerInternalVariable(controller, instance, `${name}-present`, fallback, { syntax: '*', inherits: false })
  instance.steps.push(step)
  return step
}
/**
 * 为当前消费地址发布共享结果链，公开赋值与其他声明统一进入 Join 的等级选择。
 */
function publishResult(controller: ASTController, instance: VariableInstance, member: JSSStyleNode): void {
  const address = conditionAddressKey(member.conditionPath)
  const existing = instance.results.has(address)
  const result = mapGet(instance.results, address, () => ({ path: member.conditionPath, members: new Set<JSSStyleNode>() }))
  result.members.add(member)
  if (!result.alias && (instance.definition.baseName !== instance.definition.variable!.key.toCSSString().slice(2) || instance.steps.length)) {
    result.alias = controller.insert({ before: member, conditionPath: result.path },
      [{
        /**
         * 发布当前目标名称，聚合保留最后一个有效局部结果。
         */
        toCSSString: () => instance.definition.variable!.key.toCSSString(), priority: keyPriority(instance.definition.node.key), join: joinVariableValues },
        createJSSContent(() => stageReference(instance, instance.steps.at(-1)?.name))],
      { owner: instance.definition.node, identity: `result/${address}`, productTag: instance,
        initialize: node => { variableProductRoles.set(node, 'result') } })
  }
  if (!existing) for (const step of instance.steps) publishStep(controller, step, result)
}
/**
 * 返回阶段值引用；不继承注册的阶段缺少本地规则时使用其基础值。
 */
function stageReference(instance: VariableInstance, name = instance.definition.baseName): string {
  const fallback = name !== instance.definition.baseName && instance.definition.variable!.registration?.inherits === false
    ? `, var(--${instance.definition.baseName})` : ''
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
    const presence = step.instance.definition.variable!.registration?.inherits === false ? `var(--${step.name}-present) ` : ''
    return presence + branches.join(' ')
  }, [step.currentExpression, ...[...step.members.values()].map(member => member.output)])
  const anchor = result.alias ?? [...result.members][0]
  controller.insert({ before: anchor, conditionPath: result.path }, [key, expression],
    { owner: result.alias ?? step.instance.definition.node, identity: `${step.name}/result`, productTag: step.instance,
      initialize: node => { variableProductRoles.set(node, 'result') } })
}
/**
 * 按样式书写顺序更新修改链；已有引用随步骤顺序变化，新候选更新自身阶段输出。
 */
function refreshSteps(controller: ASTController, instance: VariableInstance, changed?: VariableStep): void {
  if (!controller.nodes().includes(instance.definition.node)) return
  const nodes = controller.search({ key: instance.definition.variable!.key })
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
function removeModification(controller: ASTController, step: VariableStep, node: JSSStyleNode): void {
  const candidate = step.members.get(node)
  step.members.delete(node)
  steps.delete(node)
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
    step.instance.definition.baseName = step.instance.definition.variable!.key.toCSSString().slice(2)
  }
}
/**
 * 将公开 Variable 的 @property 约束应用到修改用的内部变量；未配置时不生成注册。
 */
function registerInternalVariable(controller: ASTController, instance: VariableInstance, name: string, owner: JSSStyleNode, registration = instance.definition.variable!.registration): void {
  if (!registration) return
  const path: ConditionPath = { targetConditionPath: [condition(`@property --${name}`)], stateConditionPath: [] }
  const provenance = { owner }
  const position = { before: instance.definition.node, conditionPath: path }
  variableRegistrationDeclarations(registration).forEach(([key, content]) =>
    controller.insert(position, [key, content], { ...provenance, identity: `${name}/${key === 'initial-value' ? 'initial' : key}` }),
  )
}
