/** Variable 在本次 AST 中的默认声明与名称联动。
 *
 * 内容访问交付已求得的配方和消费位置；稳定阶段统一协调根默认、当地配方和联动产物。
 * 来源由 AST 管理，消费资格在本会话核对，不把两端的 AND 条件误作多来源 OR。
 */
import { mapGet } from '@edsolater/fnkit'
import { condition, conditionAddressKey, isSemanticPathPrefix, type ConditionPath } from './condition'
import { isJSSContent, type JSSCompileContext, type JSSContent } from './content'
import { keyPriority, propertyName, type JSSKey, type JSSKeyObject } from './key'
import { isVariable } from './variable'
import { declaredVariable, declareVariable, findLocalBase, variableDeclarationValues, type ModifyTargetProtocol } from './variable-modify'
import { resolveVariable } from './variable-cluster'
import type { ASTController } from './compiler/ast-controller'
import type { JSSStyleNode } from './compiler/rules-to-style-nodes'
import type { ValueInput } from './value'

/**
 * 一个位置已经求得的配方及真实消费资格；快照用于识别节点输入重访。
 */
interface Consumption {
  content: ValueInput
  native: boolean
  context: JSSCompileContext
  revision: number
  keyInput: JSSKey | undefined
  contentInput: unknown
  expanded?: { base: ValueInput; values: [ConditionPath, ValueInput][] }
}
/**
 * 同一材料的当前消费者与自动声明，保存实际声明键以便稳定更新当地基础。
 */
interface Usage {
  defaultKey: JSSKeyObject
  consumers: Map<JSSStyleNode, Consumption>
  defaults: Map<string, JSSStyleNode>
}
/**
 * 单次编译的名称观察关系及其产物；不跨会话保存材料注册或来源所有权。
 */
interface DependencySession {
  usages: Map<ModifyTargetProtocol, Usage>
  observers: Map<string, Set<ModifyTargetProtocol>>
  links: Map<JSSStyleNode, Map<ModifyTargetProtocol, { node: JSSStyleNode; content: ValueInput }>>
  automatic: Set<JSSStyleNode>
  declarations: Map<JSSStyleNode, { target: ModifyTargetProtocol; base: ValueInput; key: JSSKeyObject; states: Map<ModifyTargetProtocol, JSSStyleNode[]> }>
}
const sessions = new WeakMap<object, DependencySession>()

/**
 * 收下实际访问的配方；只有原生 CSS 属性消费能激活名称依赖，资源描述和 Variable 声明不能。
 */
export function observeVariable(target: ModifyTargetProtocol, content: ValueInput, context: JSSCompileContext, controller: ASTController): void {
  const session = sessionOf(context, controller)
  const usage = mapGet(session.usages, target, () => ({ consumers: new Map(), defaults: new Map(),
    defaultKey: { ...target.key, priority: keyPriority(target.key) - 1 },
  }))
  const native = context.role === 'declaration-content' && context.key !== undefined
    && !propertyName(context.key).startsWith('--')
    && !context.conditionPath.targetConditionPath.some(item => /^@(property|function|font-face)\b/.test(item.header))
  if (!usage.consumers.has(context.node)) controller.onRemove(context.node, () => usage.consumers.delete(context.node))
  usage.consumers.set(context.node, { content, native, context, revision: context.node.compileRevision,
    keyInput: context.node.key, contentInput: context.node.content })
}

/**
 * 取得本次协调会话，稳定核验只登记一次。
 */
function sessionOf(context: JSSCompileContext, controller: ASTController): DependencySession {
  let session = sessions.get(context.session)
  if (!session) {
    sessions.set(context.session, session = { usages: new Map(), observers: new Map(), links: new Map(), automatic: new Set(), declarations: new Map() })
    controller.addSettlementCheck(() => settleDeclarations(session!, controller))
  }
  return session
}

/**
 * 记录本次声明已求得的基础材料，供已消费同名材料的原始规则当地绑定。
 * 声明重访时撤销旧借用状态，随后以新基础展开。
 */
export function observeDeclaration(target: ModifyTargetProtocol, base: ValueInput, key: JSSKeyObject, context: JSSCompileContext, controller: ASTController): void {
  const session = sessionOf(context, controller)
  const previous = session.declarations.get(context.node)
  if (previous?.target === target && previous.base === base && previous.key === key) return
  for (const products of previous?.states.values() ?? []) for (const node of products) controller.remove(node)
  session.declarations.set(context.node, { target, base, key, states: new Map() })
  if (!previous) controller.onRemove(context.node, () => session.declarations.delete(context.node))
}

/**
 * 沿结构化内容读取直接 Variable 引用，不求生产函数、不把状态所属关系当作图边。
 */
function referencedVariables(content: unknown, seen = new Set<object>()): ModifyTargetProtocol[] {
  if (!isJSSContent(content) || seen.has(content)) return []
  if (isVariable(content)) return [resolveVariable(content)]
  seen.add(content)
  return (content.dependencies ?? []).flatMap(item => referencedVariables(item, seen))
}

/**
 * 在稳定队列核对默认与联动资格；产物通过普通声明展开，再进入现有 Join 的等级竞争。
 */
function settleDeclarations(session: DependencySession, controller: ASTController): boolean {
  let changed = false
  for (const usage of session.usages.values()) for (const [node, input] of usage.consumers) {
    if (node.compileRevision !== input.revision || node.key !== input.keyInput || node.content !== input.contentInput)
      usage.consumers.delete(node)
  }
  session.observers.clear()
  for (const [target, usage] of session.usages) for (const input of usage.consumers.values()) {
    if (input.native) for (const source of referencedVariables(input.content))
      mapGet(session.observers, source.key.toCSSString(), () => new Set<ModifyTargetProtocol>()).add(target)
  }
  if (settleDefaults(session, controller)) changed = true
  if (settleSharedStates(session, controller)) changed = true
  if (settleLinks(session, controller)) changed = true
  return changed
}

/**
 * 用当前消费材料维护根默认和当地状态；物化已有配方不作为新的来源声明。
 */
function settleDefaults(session: DependencySession, controller: ASTController): boolean {
  let changed = false
  const nodes = controller.nodes()
  for (const [target, usage] of session.usages) {
    const explicit = nodes.some(node => !session.automatic.has(node) && !node.aggregate && (declaredVariable(node) === target
      || node.key === target || (isVariable(node.key) && resolveVariable(node.key) === target)))
    const desired = new Map<string, { path: ConditionPath; content: ValueInput; owners: JSSStyleNode[]; key: JSSKeyObject; root?: boolean; state?: boolean }>()
    const defaultKey = usage.defaultKey
    for (const [consumer, input] of usage.consumers) {
      const rootPath = { targetConditionPath: [condition(':root')], stateConditionPath: [] }
      if (!explicit) {
        const root = mapGet(desired, conditionAddressKey(rootPath), () => ({ path: rootPath, content: input.content, owners: [], key: defaultKey, root: true }))
        root.owners.push(consumer)
      }
      const rawLocal = nodes.some(node => !session.automatic.has(node) && !node.aggregate
        && (node.key === target || (isVariable(node.key) && resolveVariable(node.key) === target))
        && isSemanticPathPrefix(node.conditionPath, consumer.conditionPath))
      if (!rawLocal && !consumer.resourceAddress?.startsWith('variable-default:')) {
        const localBase = findLocalBase(input.context, controller, target, consumer.conditionPath)
        const base = localBase?.content ?? input.content
        if (!input.expanded || input.expanded.base !== base) input.expanded = { base,
          values: variableDeclarationValues(target.states, base, consumer.conditionPath,
            (!explicit && needsLocalValue(input.content)) || !!target.declarations?.length) }
        for (const [path, content] of input.expanded.values) {
          const state = [...target.states?.keys() ?? []].some(state => path.stateConditionPath.some(item => item.name === state.name))
          const local = mapGet(desired, conditionAddressKey(path), () => ({ path, content, owners: [], key: localBase?.key ?? defaultKey, state }))
          local.owners.push(consumer)
        }
      }
    }
    for (const [address, node] of usage.defaults) if (!desired.has(address)) {
      controller.remove(node); usage.defaults.delete(address); changed = true
    }
    for (const [address, input] of desired) {
      let node = usage.defaults.get(address)
      if (node && (node.key !== input.key || node.content !== input.content)) {
        node.key = input.key; node.content = input.content; node.compileRevision++; changed = true
      }
      if (!node) {
        const owner = input.owners[0]
        const anchor = input.root ? controller.nodes()[0] : nodes.includes(owner) ? owner : controller.nodes()[0]
        if (!anchor) continue
        node = controller.insert({ before: anchor, conditionPath: input.path }, [input.key, input.content], {
          owner, productTag: target, resourceAddress: `${input.root ? 'variable-default' : input.state ? 'variable-state' : 'variable-local'}:${target.key.toCSSString()}`,
        })
        usage.defaults.set(address, node)
        session.automatic.add(node)
        controller.onRemove(node, () => { usage.defaults.delete(address); session.automatic.delete(node!) })
        changed = true
      }
      for (const owner of input.owners) controller.depend(node, { owner })
    }
  }
  return changed
}

/**
 * 同名已消费材料为当地声明补状态规则，自身明确规则保留覆盖权。
 */
function settleSharedStates(session: DependencySession, controller: ASTController): boolean {
  let changed = false
  for (const [declaration, input] of session.declarations) {
    const active = new Set([...session.usages].flatMap(([material, usage]) => material !== input.target && material.states?.size
      && material.key.toCSSString() === input.target.key.toCSSString() && [...usage.consumers.values()].some(item => item.native) ? [material] : []))
    for (const [material, products] of input.states) if (!active.has(material)) {
      for (const node of products) controller.remove(node)
      input.states.delete(material); changed = true
    }
    for (const material of active) {
      if (input.states.has(material)) continue
      const ownStates = new Set([...input.target.states?.keys() ?? []].map(state => state.name))
      const states = new Map([...material.states ?? []].filter(([state]) => !ownStates.has(state.name)))
      const products = variableDeclarationValues(states, input.base, declaration.conditionPath, false).map(([path, content]) =>
        controller.insert({ before: declaration, conditionPath: path }, [input.key, content], { owner: declaration }))
      input.states.set(material, products)
      changed ||= products.length > 0
    }
  }
  return changed
}

/**
 * 当前来源与真实消费同时有效时发布联动；实际来源拥有产物，消费退出另行撤销资格。
 */
function settleLinks(session: DependencySession, controller: ASTController): boolean {
  let changed = false
  for (const source of controller.nodes()) {
    if (!source.key || source.aggregate || (session.automatic.has(source) && !source.resourceAddress?.startsWith('variable-state:'))
      || declaredVariable(source) || source.content === undefined) continue
    const targets = session.observers.get(propertyName(source.key)) ?? new Set<ModifyTargetProtocol>()
    let links = session.links.get(source)
    if (!links && targets.size) {
      session.links.set(source, links = new Map())
      controller.onRemove(source, () => session.links.delete(source))
    }
    for (const [target, product] of links ?? []) {
      if (!targets.has(target) || ![...session.usages.get(target)?.consumers.values() ?? []].some(input => input.native)) {
        controller.remove(product.node); links!.delete(target); changed = true
      }
    }
    for (const target of targets) {
      const usage = session.usages.get(target)
      const active = [...usage?.consumers.values() ?? []].find(input => input.native
        && referencedVariables(input.content).some(item => item.key.toCSSString() === propertyName(source.key!)))
      if (!active || target.key.toCSSString() === propertyName(source.key)) continue
      const previous = links!.get(target)
      if (previous?.content === active.content) continue
      if (previous) controller.remove(previous.node)
      const node = controller.insert({ after: source, conditionPath: source.conditionPath },
        declareVariable(target, active.content, (target.key.priority ?? 0) - 1), { owner: source, productTag: target })
      links!.set(target, { node, content: active.content })
      session.automatic.add(node)
      controller.onRemove(node, () => { links!.delete(target); session.automatic.delete(node) })
      changed = true
    }
  }
  return changed
}

/**
 * 读取 Variable 或具有编译消费行为的配方须在当地建立默认关系；常量只从根继承。
 */
function needsLocalValue(content: unknown, seen = new Set<JSSContent>()): boolean {
  if (!isJSSContent(content) || seen.has(content)) return false
  if (isVariable(content) || content.onCompile) return true
  seen.add(content)
  return content.dependencies?.some(item => needsLocalValue(item, seen)) ?? false
}
