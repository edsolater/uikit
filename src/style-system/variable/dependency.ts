/** 本次 AST 的默认声明与 CSS 名称联动。
 *
 * 从实际消费取得配方，统一请求声明基础与状态；来源存活仍由 AST 管理。
 *
 * 子元素重新声明来源时，派生关系须在当地建立，不能只继承祖先已经算好的值。
 */
import { mapGet } from '@edsolater/fnkit'
import { condition, conditionAddressKey, isSemanticPathPrefix, type ConditionPath } from '../condition'
import { isJSSContent, type JSSCompileContext, type JSSContent } from '../content'
import { keyPriority, propertyName, type JSSKey, type JSSKeyObject } from '../key'
import { isVariable, type VariableTarget } from './core'
import { declaredVariable, declareVariable, findVariableDeclaration, publishVariableBase, syncVariableStates, syncDeclarations, variableDefinition,
  variableProductRoles, type VariableDefinition } from './declare'
import { resolveVariable } from '../variable-cluster'
import type { ASTController } from '../compiler/ast-controller'
import type { JSSStyleNode } from '../compiler/rules-to-style-nodes'
import type { ValueInput } from '../value'

/** 已求得的消费配方及原节点快照；失效时退出名称索引。 */
interface Consumption {
  content: ValueInput
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
  content: ValueInput
  owners: JSSStyleNode[]
  key: JSSKey
  kind: 'root' | 'local' | 'states'
}
/** 名称索引直接带当前配方，默认与联动不另存公共声明归属。 */
interface DependencySession {
  usages: Map<VariableTarget, Usage>
  observers: Map<string, Map<VariableTarget, Consumption>>
  links: Map<JSSStyleNode, Map<VariableTarget, { node: JSSStyleNode; content: ValueInput }>>
}
const sessions = new WeakMap<object, DependencySession>()

/**
 * 记录实际访问的配方；只有原生 CSS 属性激活依赖，描述符和独立声明不激活。
 */
export function observeVariable(target: VariableTarget, content: ValueInput, context: JSSCompileContext, controller: ASTController): void {
  const session = sessionOf(context, controller)
  const usage = mapGet(session.usages, target, () => ({ consumers: new Map(), defaults: new Map(),
    defaultKey: { ...target.key, priority: keyPriority(target.key) - 1 },
  }))
  const native = context.role === 'declaration-content' && context.key !== undefined
    && !propertyName(context.key).startsWith('--')
    && !context.conditionPath.targetConditionPath.some(item => /^@(property|function|font-face)\b/.test(item.header))
  if (!usage.consumers.has(context.node)) controller.onRemove(context.node, () => usage.consumers.delete(context.node))
  usage.consumers.set(context.node, { content, native, revision: context.node.compileRevision,
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
function referencedVariables(content: unknown, seen = new Set<object>()): VariableTarget[] {
  if (!isJSSContent(content) || seen.has(content)) return []
  if (isVariable(content)) return [resolveVariable(content)]
  seen.add(content)
  return (content.dependencies ?? []).flatMap(item => referencedVariables(item, seen))
}

/**
 * 由当前有效消费重建名称索引；声明与消费资格同时成立才保留联动。
 */
function settleDeclarations(session: DependencySession, controller: ASTController): boolean {
  const active = new Map<string, Set<VariableTarget>>()
  session.observers.clear()
  for (const [target, usage] of session.usages) for (const [node, input] of usage.consumers) {
    if (node.compileRevision !== input.revision || node.key !== input.keyInput || node.content !== input.contentInput) {
      usage.consumers.delete(node); continue
    }
    if (!input.native) continue
    mapGet(active, target.key.toCSSString(), () => new Set<VariableTarget>()).add(target)
    for (const source of referencedVariables(input.content))
      mapGet(mapGet(session.observers, source.key.toCSSString(), () => new Map()), target, () => input)
  }
  if (settleDefaults(session, active, controller)) return true
  return syncDeclarations(controller, active) || settleLinks(session, controller)
}

/**
 * 将消费需求归一成根基础、当地关系或当地状态；已有声明的同址状态由原实例负责。
 */
function settleDefaults(session: DependencySession, active: Map<string, Set<VariableTarget>>, controller: ASTController): boolean {
  let changed = false
  const nodes = controller.nodes()
  const requests = new Map<VariableTarget, Map<string, DefinitionRequest>>()
  for (const [target, usage] of session.usages) {
    const declarations = nodes.filter(node => !variableProductRoles.has(node) && !node.aggregate && (declaredVariable(node) === target
      || node.key === target || (isVariable(node.key) && resolveVariable(node.key) === target)))
    const desired = new Map<string, DefinitionRequest>()
    for (const [consumer, input] of usage.consumers) {
      if (!declarations.length) {
        const path = { targetConditionPath: [condition(':root')], stateConditionPath: [] }
        mapGet(desired, conditionAddressKey(path), (): DefinitionRequest => ({ path, content: input.content, owners: [], key: usage.defaultKey, kind: 'root' })).owners.push(consumer)
      }
      const rawLocal = declarations.some(node => !declaredVariable(node) && isSemanticPathPrefix(node.conditionPath, consumer.conditionPath))
      if (rawLocal || variableProductRoles.get(consumer) === 'default') continue
      const declaration = findVariableDeclaration(controller, target, consumer.conditionPath)
      const local = declaration && variableDefinition(declaration)
      if (local && conditionAddressKey(local.path) === conditionAddressKey(consumer.conditionPath)) continue
      const kind = (!declarations.length && needsLocalValue(input.content)) || target.declarations?.length ? 'local' : 'states'
      mapGet(desired, conditionAddressKey(consumer.conditionPath), (): DefinitionRequest => ({ path: consumer.conditionPath,
        content: local?.baseContent ?? input.content, owners: [], key: local?.baseKey ?? usage.defaultKey, kind })).owners.push(consumer)
    }
    requests.set(target, desired)
  }
  for (const [target, desired] of requests) {
    const usage = session.usages.get(target)!
    for (const [address, record] of usage.defaults) {
      const wanted = desired.get(address)
      if (wanted && wanted.content === record.definition.baseContent && wanted.key === record.definition.baseKey && wanted.kind === record.kind
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
          baseContent: request.content, baseKey: request.key, stateProducts: new Map() }
        if (request.kind !== 'states') {
          const anchor = request.kind === 'root' ? controller.nodes()[0] : owner
          const base = publishVariableBase(definition, controller, anchor)
          if (variableProductRoles.get(base) !== 'state') variableProductRoles.set(base, 'default')
        }
        usage.defaults.set(address, record = { definition, kind: request.kind })
        changed = true
      }
      record.definition.node = request.owners[0]
      if (record.definition.baseNode) for (const owner of request.owners) controller.depend(record.definition.baseNode, { owner })
      if (record.kind !== 'root' && syncVariableStates(record.definition, active.get(target.key.toCSSString()) ?? [], controller)) changed = true
      for (const product of record.definition.stateProducts.values())
        for (const owner of request.owners) controller.depend(product.node, { owner })
    }
  }
  return changed
}

/**
 * 来源拥有联动产物；当前名称索引同时提供有效消费材料，退出需求时撤销资格。
 */
function settleLinks(session: DependencySession, controller: ASTController): boolean {
  let changed = false
  for (const source of controller.nodes()) {
    if (!source.key || source.aggregate || ['default', 'control'].includes(variableProductRoles.get(source) ?? '') || declaredVariable(source) || source.content === undefined) continue
    const targets = session.observers.get(propertyName(source.key)) ?? new Map<VariableTarget, Consumption>()
    let links = session.links.get(source)
    if (!links && targets.size) {
      session.links.set(source, links = new Map())
      controller.onRemove(source, () => session.links.delete(source))
    }
    for (const [target, product] of links ?? []) if (!targets.has(target)) {
      controller.remove(product.node); links!.delete(target); changed = true
    }
    for (const [target, input] of targets) {
      const content = input.content
      if (target.key.toCSSString() === propertyName(source.key)) continue
      const previous = links!.get(target)
      if (previous?.content === content) continue
      if (previous) controller.remove(previous.node)
      const node = controller.insert({ after: source, conditionPath: source.conditionPath },
        declareVariable(target, content, keyPriority(target.key) - 1), { owner: source, productTag: target })
      links!.set(target, { node, content })
      variableProductRoles.set(node, 'linked')
      controller.onRemove(node, () => links!.delete(target))
      changed = true
    }
  }
  return changed
}

/**
 * 结构化来源与编译内容需要当地关系，常量基础只从根继承。
 */
function needsLocalValue(content: unknown, seen = new Set<JSSContent>()): boolean {
  if (!isJSSContent(content) || seen.has(content)) return false
  if (isVariable(content) || content.onCompile) return true
  seen.add(content)
  return content.dependencies?.some(item => needsLocalValue(item, seen)) ?? false
}
