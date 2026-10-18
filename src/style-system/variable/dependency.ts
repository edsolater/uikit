/** 本次 AST 的默认声明与 具体变量联动。
 *
 * 从实际消费取得配方，统一请求声明基础与状态；来源存活仍由 AST 管理。
 *
 * 子元素重新声明来源时，派生关系须在当地建立，不能只继承祖先已经算好的值。
 */
import { isObjectLike, mapGet } from '@edsolater/fnkit'
import { condition, conditionAddressKey, isSemanticPathPrefix, type ConditionPath, type StateConditionPath } from '../condition'
import { type JSSCompileContext } from '../content'
import { keyPriority, propertyName, type JSSKey, type JSSKeyObject } from '../key'
import { isVariable, type VariableTarget, type VariableStateRule } from './core'
import { declaredVariable, createVariableDeclaration, findVariableDeclaration, publishVariableBase, syncVariableStates, syncDeclarations, variableDefinition,
  variableProductRoles, type VariableDefinition } from './declare'
import type { ASTController, ContentCompilationRecord } from '../compiler/ast-controller'
import type { JSSStyleNode } from '../compiler/rules-to-style-nodes'
import { appendStateCondition } from '../pieces/state-conditions'
import type { ValueInput } from '../value'

/** 一份配方的展开位置、状态条件和真实基础来源。 */
interface Recipe {
  content: ValueInput
  /** 配方实际编译的位置；状态边读取具体状态产物的展开记录。 */
  sourceNode: JSSStyleNode
  states?: StateConditionPath
  /** 状态边的真实基础来源；可为声明或原生消费，投影重建不自激。 */
  originNode: JSSStyleNode
  /** 原始状态规则的身份变化也会使联动失效。 */
  rule?: VariableStateRule
}
/** 所选基础与原消费快照；失效时退出对象索引。 */
interface Consumption extends Recipe {
  native: boolean
  revision: number
  keyInput: JSSKey | undefined
  contentInput: unknown
}
/** 一个材料的消费者及各完整地址上的自动声明。 */
interface Usage {
  defaultKey: JSSKeyObject
  consumers: Map<JSSStyleNode, Consumption>
  defaults: Map<string, { definition: VariableDefinition; kind: 'root' | 'local' | 'states' }>
}
/** 自动声明的完整地址及实际需求；根基础、当地关系与状态只在此归一。 */
interface DefinitionRequest {
  path: ConditionPath
  sourceNode: JSSStyleNode
  originNode: JSSStyleNode
  content: ValueInput
  owners: JSSStyleNode[]
  key: JSSKey
  kind: 'root' | 'local' | 'states'
}
/** 一份条件联动声明及其真实基础来源；实际状态产物不另建失效源。 */
interface LinkedDeclaration {
  node: JSSStyleNode
  content: ValueInput
  originNode: JSSStyleNode
  originCompilation?: ContentCompilationRecord
  rule?: VariableStateRule
}
/** 对象索引直接带当前配方，默认与联动不另存公共声明归属。 */
interface DependencySession {
  usages: Map<VariableTarget, Usage>
  observers: Map<VariableTarget, Map<VariableTarget, Map<string, Recipe>>>
  links: Map<JSSStyleNode, Map<VariableTarget, Map<string, LinkedDeclaration>>>
}
const sessions = new WeakMap<object, DependencySession>()

/**
 * 记录实际访问的配方；只有原生 CSS 属性激活依赖，描述符和独立声明不激活。
 */
export function observeVariable(target: VariableTarget, content: ValueInput, context: JSSCompileContext, controller: ASTController, sourceNode = context.node, originNode = variableDefinition(context.node)?.originNode ?? sourceNode): void {
  const session = sessionOf(context, controller)
  if (context.role === 'declaration-key') return
  const usage = mapGet(session.usages, target, () => ({ consumers: new Map(), defaults: new Map(),
    defaultKey: { ...target.key, priority: keyPriority(target.key) - 1 },
  }))
  const native = context.role === 'declaration-content' && context.key !== undefined
    && !propertyName(context.key).startsWith('--')
    && !context.conditionPath.targetConditionPath.some(item => /^@(property|function|font-face)\b/.test(item.header))
  if (!usage.consumers.has(context.node)) controller.onRemove(context.node, () => usage.consumers.delete(context.node))
  usage.consumers.set(context.node, { content, sourceNode, originNode, native, revision: context.node.compileRevision,
    keyInput: context.node.key, contentInput: context.node.content })
}

/**
 * 每个编译会话只登记一次稳定核验。
 */
function sessionOf(context: JSSCompileContext, controller: ASTController): DependencySession {
  let session = sessions.get(context.session)
  if (!session) {
    sessions.set(context.session, session = { usages: new Map(), observers: new Map(), links: new Map() })
    controller.addSettlementCheck(() => settleDeclarations(session!, controller))
  }
  return session
}

/**
 * 只读已求得内容的结构化依赖，不再执行生产函数，也不把状态归属当图边。
 */
function collectReferencedVariables(content: unknown, node: JSSStyleNode, controller: ASTController, seen = new Set<object>()): VariableTarget[] {
  if (!isObjectLike(content) || seen.has(content)) return []
  if (isVariable(content)) return [content]
  seen.add(content)
  const compiled = controller.getCompiledContent(node, content)
  if (compiled !== content) return collectReferencedVariables(compiled, node, controller, seen)
  return (controller.getContentCompilation(node, content)?.dependencies ?? []).flatMap(item => collectReferencedVariables(item, node, controller, seen))
}

/**
 * 由当前有效消费重建对象索引；声明与消费资格同时成立才保留联动。
 */
function settleDeclarations(session: DependencySession, controller: ASTController): boolean {
  const active = new Set<VariableTarget>()
  session.observers.clear()
  for (const [target, usage] of session.usages) for (const [node, input] of usage.consumers) {
    if (node.compileRevision !== input.revision || node.key !== input.keyInput || node.content !== input.contentInput) {
      usage.consumers.delete(node); continue
    }
    if (!input.native) continue
    active.add(target)
    observeRecipe(session, target, input, input.content, controller)
  }
  const definitions = new Set<VariableDefinition>()
  for (const usage of session.usages.values()) for (const record of usage.defaults.values()) definitions.add(record.definition)
  for (const node of controller.nodes()) { const definition = variableDefinition(node); if (definition) definitions.add(definition) }
  for (const definition of definitions) for (const product of definition.stateProducts.values()) {
    if (active.has(product.material))
      observeRecipe(session, product.material, { content: definition.baseContent, sourceNode: product.node,
        states: product.node.conditionPath.stateConditionPath, originNode: definition.originNode, rule: product.rule }, product.node.content, controller)
  }
  if (settleDefaults(session, controller)) return true
  return syncDeclarations(controller) || settleLinks(session, controller)
}

/**
 * 将消费需求归一成根基础、当地关系或当地状态；已有声明的同址状态由原实例负责。
 */
function settleDefaults(session: DependencySession, controller: ASTController): boolean {
  let changed = false
  const nodes = controller.nodes()
  const requests = new Map<VariableTarget, Map<string, DefinitionRequest>>()
  for (const [target, usage] of session.usages) {
    const declarations = nodes.filter(node => !variableProductRoles.has(node) && !node.aggregate && (declaredVariable(node) === target
      || node.key === target))
    const desired = new Map<string, DefinitionRequest>()
    for (const [consumer, input] of usage.consumers) {
      if (!declarations.length) {
        const path = { targetConditionPath: [condition(':root')], stateConditionPath: [] }
        mapGet(desired, conditionAddressKey(path), (): DefinitionRequest => ({ path, sourceNode: input.sourceNode, originNode: input.originNode, content: input.content, owners: [], key: usage.defaultKey, kind: 'root' })).owners.push(consumer)
      }
      const rawLocal = declarations.some(node => !declaredVariable(node) && isSemanticPathPrefix(node.conditionPath, consumer.conditionPath))
      if (rawLocal || variableProductRoles.get(consumer) === 'default') continue
      const declaration = findVariableDeclaration(controller, target, consumer.conditionPath)
      const local = declaration && variableDefinition(declaration)
      if (local && conditionAddressKey(local.path) === conditionAddressKey(consumer.conditionPath)) continue
      const kind = (!declarations.length && collectReferencedVariables(input.content, input.sourceNode, controller).length > 0) || target.declarations?.length ? 'local' : 'states'
      mapGet(desired, conditionAddressKey(consumer.conditionPath), (): DefinitionRequest => ({ path: consumer.conditionPath, sourceNode: local?.baseNode ?? input.sourceNode, originNode: local?.originNode ?? input.originNode,
        content: local?.baseContent ?? input.content, owners: [], key: local?.baseKey ?? usage.defaultKey, kind })).owners.push(consumer)
    }
    requests.set(target, desired)
  }
  for (const [target, desired] of requests) {
    const usage = session.usages.get(target)!
    for (const [address, record] of usage.defaults) {
      const wanted = desired.get(address)
      if (wanted && wanted.sourceNode === record.definition.sourceNode && wanted.originNode === record.definition.originNode && controller.getContentCompilation(wanted.sourceNode, wanted.sourceNode.content) === record.definition.sourceCompilation && wanted.content === record.definition.baseContent && wanted.key === record.definition.baseKey && wanted.kind === record.kind
        && (!record.definition.baseNode || controller.nodes().includes(record.definition.baseNode))) continue
      if (record.definition.baseNode) controller.remove(record.definition.baseNode)
      for (const product of record.definition.stateProducts.values()) controller.remove(product.node)
      usage.defaults.delete(address); changed = true
    }
  }
  if (changed) return true
  for (const [target, desired] of requests) {
    const usage = session.usages.get(target)!
    for (const [address, request] of desired) {
      let record = usage.defaults.get(address)
      if (!record) {
        const owner = request.owners[0]
        const definition: VariableDefinition = { node: owner, path: request.path, variable: target,
          baseContent: request.content, sourceNode: request.sourceNode, originNode: request.originNode, sourceCompilation: controller.getContentCompilation(request.sourceNode, request.sourceNode.content), baseKey: request.key, stateProducts: new Map() }
        if (request.kind !== 'states') {
          const anchor = request.kind === 'root' ? controller.nodes()[0] : owner
          const base = publishVariableBase(definition, controller, anchor)
          variableProductRoles.set(base, 'default')
        }
        usage.defaults.set(address, record = { definition, kind: request.kind })
        changed = true
      }
      record.definition.node = request.owners[0]
      if (record.definition.baseNode) for (const owner of request.owners) controller.depend(record.definition.baseNode, { owner })
      if (record.kind !== 'root' && syncVariableStates(record.definition, controller)) changed = true
      for (const product of record.definition.stateProducts.values())
        for (const owner of request.owners) controller.depend(product.node, { owner })
    }
  }
  return changed
}

/**
 * 按实际展开位置登记配方对象边；状态边保留其条件，基础内容用于当地重新绑定。
 */
function observeRecipe(session: DependencySession, target: VariableTarget, input: Recipe, content: unknown, controller: ASTController): void {
  const address = JSON.stringify((input.states ?? []).map(state => state.name))
  for (const name of collectReferencedVariables(content, input.sourceNode, controller))
    mapGet(mapGet(session.observers, name, () => new Map()), target, () => new Map()).set(address, input)
}

/**
 * 来源拥有联动产物；状态边只在合并后的状态地址发布，不泄漏为无条件基础。
 */
function settleLinks(session: DependencySession, controller: ASTController): boolean {
  let changed = false
  for (const source of controller.nodes()) {
    if (!source.key || source.aggregate || ['default', 'control'].includes(variableProductRoles.get(source) ?? '') || source.content === undefined) continue
    const targets = session.observers.get(variableDefinition(source)?.variable!) ?? new Map<VariableTarget, Map<string, Recipe>>()
    let links = session.links.get(source)
    if (!links && targets.size) {
      session.links.set(source, links = new Map())
      controller.onRemove(source, () => session.links.delete(source))
    }
    for (const [target, products] of links ?? []) if (!targets.has(target)) {
      for (const product of products.values()) { controller.remove(product.node); return true }
      links!.delete(target); changed = true
    }
    for (const [target, inputs] of targets) {
      if (target === variableDefinition(source)?.variable) continue
      const products = mapGet(links!, target, () => new Map())
      for (const [address, product] of products) if (!inputs.has(address)) {
        controller.remove(product.node); products.delete(address); return true
      }
      for (const [address, input] of inputs) {
        const path = (input.states ?? []).reduce(appendStateCondition, source.conditionPath)
        // 同一消费地址已物化该配方时，沿用其实际展开结果。
        const local = session.usages.get(target)?.defaults.get(conditionAddressKey(path))
        if (local && local.kind !== 'states') continue
        const previous = products.get(address)
        const origin = input.originNode
        const sourceCompilation = controller.getContentCompilation(origin, origin.content)
        if (previous && previous.content === input.content && previous.originNode === origin && previous.originCompilation === sourceCompilation && previous.rule === input.rule) continue
        // 撤旧会级联移除当前来源，交下一轮用现存队列继续发布。
        if (previous) { controller.remove(previous.node); return true }
        const node = controller.insert({ after: source, conditionPath: path },
          createVariableDeclaration(target, input.content, keyPriority(target.key) - 1, origin), { owner: source, productTag: target })
        products.set(address, { node, content: input.content, originNode: origin, originCompilation: sourceCompilation, rule: input.rule })
        variableProductRoles.set(node, 'linked')
        controller.onRemove(node, () => products.delete(address))
        changed = true
      }
    }
  }
  return changed
}
