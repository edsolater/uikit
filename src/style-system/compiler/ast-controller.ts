/** 编译会话的节点查询、队列编辑与依赖来源。 */
import { assert } from '@edsolater/fnkit'
import { conditionAddressKey, type ConditionPath } from '../condition'
import { propertyName, type JSSKey } from '../key'
import type { JSSStyleNode } from './rules-to-style-nodes'

/** 查询字段取交集；未指定的字段不限制结果。 */
export interface ASTQuery {
  key?: JSSKey
  conditionPath?: ConditionPath
  productTag?: object
  resourceAddress?: string
}
/** 锚点与方向是互斥选择。 */
export type ASTPosition = { before: JSSStyleNode; after?: never } | { after: JSSStyleNode; before?: never }

/** 查询和改写本次编译的样式节点。 */
export interface ASTController {
  /** 当前输出队列的有序查询，没有副作用；Key 按属性名、条件路径按输出地址匹配。 */
  search(query: ASTQuery): JSSStyleNode[]
  /** 按同一查询语义判断是否存在节点。 */
  has(query: ASTQuery): boolean
  /** 内部逃生舱：取得输出队列快照；常规查询使用 search。 */
  nodes(): JSSStyleNode[]
  /** 位置、声明和来源分别传入；插入点紧邻锚点，不隐含当前编译位置。 */
  insert(position: { conditionPath: ConditionPath } & ASTPosition, declaration: [key: JSSKey | undefined, content: unknown], provenance: {
    owner: JSSStyleNode
    identity?: string
    productTag?: object
    resourceAddress?: string
  }): JSSStyleNode
  /** 移到紧邻锚点的位置，不改变地址或来源。 */
  move(node: JSSStyleNode, position: ASTPosition): void
  /** 默认撤销及级联清理；from: output 仅退出输出，保留来源且不触发撤销清理。 */
  remove(node: JSSStyleNode, options?: { from: 'output' }): void
  /** 显式来源节点依赖此产物；全部依赖者撤销后，非源产物才随之撤销。 */
  depend(node: JSSStyleNode, options: { owner: JSSStyleNode }): void
  /** 注册节点撤销时执行的清理；只退出输出不触发。 */
  onRemove(node: JSSStyleNode, cleanup: () => void): void
  /** 写入指定节点的 deferredReason；编译无进展时报告此原因。 */
  defer(node: JSSStyleNode, message: string): void
}

const maximumStyleNodeCount = 100_000

/** 为本次编译建立无当前位置的队列控制器。 */
export function createASTController(session: ASTSession): ASTController {
  const search = (query: ASTQuery): JSSStyleNode[] => session.nodes.filter((node) =>
    (query.key === undefined || (node.key !== undefined && propertyName(node.key) === propertyName(query.key))) &&
    (query.conditionPath === undefined || conditionAddressKey(node.conditionPath) === conditionAddressKey(query.conditionPath)) &&
    (query.productTag === undefined || node.productTag === query.productTag) &&
    (query.resourceAddress === undefined || node.resourceAddress === query.resourceAddress),
  )
  return {
    search,
    has: (query) => search(query).length > 0,
    nodes: () => session.nodes.slice(),
    insert(position, [key, content], provenance) {
      const direction = position.after ? 'after' : 'before'
      const anchor = position.before ?? position.after!
      const identity = provenance.identity === undefined
        ? session.insertionIdentity(provenance.owner)
        : `${provenance.owner.identity}/rewrite/${provenance.identity}`
      const node = session.insert(provenance.owner, identity, position.conditionPath, key, content, anchor, direction, provenance.productTag)
      node.resourceAddress = provenance.resourceAddress
      return node
    },
    move: (node, position) => session.move(node, position.before ?? position.after!, position.after ? 'after' : 'before'),
    remove: (node, options) => options?.from === 'output' ? session.detach(node) : session.remove(node),
    depend: (node, options) => session.own(options.owner, node),
    onRemove: (node, cleanup) => session.onRemove(node, cleanup),
    defer: (node, message) => { node.deferredReason = new Error(message) },
  }
}

/** 保存一次编译中的节点来源和撤销生命周期。 */
export class ASTSession {
  identity: object = {}
  private owners = new Map<JSSStyleNode, Set<JSSStyleNode>>()
  private removalCallbacks = new WeakMap<JSSStyleNode, Set<() => void>>()
  private insertionCounts = new WeakMap<JSSStyleNode, number>()
  private roots: Set<JSSStyleNode>
  private detachedNodes = new Set<JSSStyleNode>()

  constructor(public nodes: JSSStyleNode[]) {
    this.roots = new Set(nodes)
    nodes.forEach((node, index) => {
      node.identity ??= `source/${index}`
      node.compileRevision ??= 0
    })
  }

  /** 给同一来源的连续插入分配不同身份，无需知道调用角色。 */
  insertionIdentity(owner: JSSStyleNode): string {
    const index = this.insertionCounts.get(owner) ?? 0
    this.insertionCounts.set(owner, index + 1)
    return `${owner.identity}/insert/${index}`
  }

  /** 记录节点来源；非源规则节点失去全部来源后随之移除。 */
  own(owner: JSSStyleNode, node: JSSStyleNode): void {
    if (owner === node) return
    let sources = this.owners.get(node)
    if (!sources) this.owners.set(node, sources = new Set())
    sources.add(owner)
  }

  /** 展开入口不再输出，但它仍把祖先来源连接到产物。 */
  detach(node: JSSStyleNode): void {
    const index = this.nodes.indexOf(node)
    if (index < 0) return
    this.nodes.splice(index, 1)
    this.detachedNodes.add(node)
    delete node.deferredReason
  }

  /** 已脱离输出的展开入口仍是有效来源，级联撤销后才失效。 */
  isAlive(node: JSSStyleNode): boolean {
    return this.nodes.includes(node) || this.detachedNodes.has(node)
  }

  /** 删除指定产物及失去全部存活来源的后继，保留共享消费者的依赖。 */
  remove(node: JSSStyleNode): void {
    const index = this.nodes.indexOf(node)
    if (index < 0 && !this.detachedNodes.has(node)) return
    if (index >= 0) this.nodes.splice(index, 1)
    this.detachedNodes.delete(node)
    this.owners.delete(node)
    this.roots.delete(node)
    delete node.deferredReason
    for (const cleanup of this.removalCallbacks.get(node) ?? []) cleanup()
    this.removalCallbacks.delete(node)
    for (const [child, sources] of [...this.owners]) {
      sources.delete(node)
      if (!sources.size && !this.roots.has(child)) this.remove(child)
    }
  }

  /** 所有即时插入共用节点创建、来源登记和位置处理。 */
  insert(owner: JSSStyleNode, identity: string, path: ConditionPath, key: JSSKey | undefined, content: unknown, anchor = owner, position: 'before' | 'after' = 'before', productTag?: object): JSSStyleNode {
    const index = this.nodes.indexOf(anchor)
    assert(index >= 0 && this.isAlive(owner), '不能在已撤销或已脱离输出的节点位置生成内容。')
    const node: JSSStyleNode = {
      identity,
      compileRevision: 0,
      conditionPath: {
        semanticPath: path.semanticPath?.slice(),
        targetConditionPath: [...path.targetConditionPath],
        stateConditionPath: [...path.stateConditionPath],
      },
      key,
      content,
      productTag,
    }
    this.own(owner, node)
    this.append([node], index + (position === 'after' ? 1 : 0))
    return node
  }

  /** 已展开的依赖节点也通过同一入口进入输出队列。 */
  append(nodes: JSSStyleNode[], index = this.nodes.length): void {
    assert(this.nodes.length + nodes.length <= maximumStyleNodeCount, `AST 节点超过上限 ${maximumStyleNodeCount}，编译无法终止。`)
    this.nodes.splice(index, 0, ...nodes)
  }

  /** 将现存节点紧邻锚点放置，不改变地址或来源。 */
  move(node: JSSStyleNode, anchor: JSSStyleNode, position: 'before' | 'after'): void {
    if (node === anchor || !this.nodes.includes(node) || !this.nodes.includes(anchor)) return
    this.nodes.splice(this.nodes.indexOf(node), 1)
    this.nodes.splice(this.nodes.indexOf(anchor) + (position === 'after' ? 1 : 0), 0, node)
  }

  /** 登记节点撤销时执行的清理函数。 */
  onRemove(node: JSSStyleNode, cleanup: () => void): void {
    let callbacks = this.removalCallbacks.get(node)
    if (!callbacks) this.removalCallbacks.set(node, callbacks = new Set())
    callbacks.add(cleanup)
  }
}
