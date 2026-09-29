/** 编译会话的节点定位、依赖所有权与当前位置操作。 */
import { assert } from '@edsolater/fnkit'
import { semanticPathParts, isSemanticPathPrefix, type ConditionPath } from '../condition'
import { propertyName, type JSSKey } from '../key'
import type { JSSContent } from '../content'
import type { JSSStyleNode } from './rules-to-style-nodes'
/** 在当前解析位置查询和改写本次编译的样式节点。 */
export interface ASTController {
  /** 当前正在解析的节点。 */
  node: JSSStyleNode
  /** 返回当前输出队列的节点快照。 */
  nodes(): JSSStyleNode[]
  /** 按不透明标识取得仍在输出队列中的生成产物。 */
  productsByTag(tag: object): JSSStyleNode[]
  /** 为已有节点增加当前节点作为来源，使共享产物在仍有来源时保留。 */
  retain(node: JSSStyleNode): void
  /** 移除节点及失去全部来源的后继节点。 */
  removeNode(node: JSSStyleNode): void
  /** 本次编译的功能私有状态；编译结束后释放。 */
  sessionValue<T>(key: object, create: () => T): T
  /** 沿目标地址的原始语义父链找到最近的指定节点，包含同层定义。 */
  findParent(matches: (node: JSSStyleNode) => boolean, path?: ConditionPath): JSSStyleNode | undefined
  /** 按 AST 顺序查找两侧最近匹配；位置已退出队列时没有邻居。 */
  neighbors(matches: (node: JSSStyleNode) => boolean, from?: JSSStyleNode): { previous?: JSSStyleNode; next?: JSSStyleNode }
  /** 在指定来源节点前插入声明，随来源撤销；identity 区分同一来源的产物。 */
  insertAt(owner: JSSStyleNode, identity: string, path: ConditionPath, key: JSSKey | undefined, content: unknown): JSSStyleNode
  /** 移动内部节点的输出位置，不改变其 Condition Path 或依赖来源。 */
  moveBefore(node: JSSStyleNode, anchor: JSSStyleNode): void
  /** 使现存节点在后续解析波重新解析。 */
  revisit(node: JSSStyleNode): void
  /** 节点被撤销时执行清理。 */
  onRemove(node: JSSStyleNode, cleanup: () => void): void
  /** 暂缓当前节点；解析再无进展时抛出指定错误。 */
  defer(message: string): void
  /** 当前解析波；对象可据此决定是否已经到达自己的解析时机。 */
  parseWaveIndex: number
  /** 当前节点的目标地址与主体状态。 */
  conditionPath: ConditionPath
  key: JSSKey | undefined
  content: unknown
  /** 区分正在解析声明目标还是声明内容。 */
  role: 'declaration-key' | 'declaration-content'
  /** 请求激活一个内容对象；同一对象在本次编译中只通知一次。 */
  activate(value: JSSContent): void
  /** 有存活来源时复用同一对象的产物；全部来源撤销后可重新生成。 */
  withClaim(value: object, build: () => void): void
  /** 按属性名和条件地址查找第一条节点；缺省地址是当前位置。 */
  findByKey(key: JSSKey, conditionPath?: ConditionPath): JSSStyleNode | undefined
  /** 相对当前节点插入内容，默认插在前面；新节点从下一波开始解析。productTag 供 productsByTag 查询产物，不改变来源关系。 */
  insert(conditionPath: ConditionPath, key: JSSKey | undefined, content: unknown, position?: 'before' | 'after', productTag?: object): JSSStyleNode
  /** 从输出队列移除当前展开入口，保留它对已生成产物的来源关系。 */
  detach(): void
  /** 删除本次队列中同资源地址的旧节点。 */
  replaceResource(address: string): void
  /** 在当前节点前登记资源声明，使后续同地址资源可替换它。 */
  insertResource(address: string, conditionPath: ConditionPath, key: JSSKey | undefined, content: unknown): JSSStyleNode
}

const maximumStyleNodeCount = 100_000

/** 为当前解析位置建立控制器；其操作直接作用于本次编译的节点队列。 */
export function createASTController(
  session: ASTSession,
  currentNode: JSSStyleNode,
  role: ASTController['role'],
  parseWaveIndex: number,
  activate: (value: JSSContent) => void,
): ASTController {
  const styleNodes = session.nodes
  const { conditionPath, key, content } = currentNode
  const currentPath = {
    semanticPath: conditionPath.semanticPath?.slice(),
    targetConditionPath: [...conditionPath.targetConditionPath],
    stateConditionPath: [...conditionPath.stateConditionPath],
  }
  let lastAfterNode = currentNode

  /** 插入当前节点的产物；连续向后插入时保持调用顺序。 */
  const insert = (path: ConditionPath, nodeKey: JSSKey | undefined, nodeContent: unknown, position: 'before' | 'after' = 'before', productTag?: object): JSSStyleNode => {
    const anchor = position === 'after' && session.isAlive(lastAfterNode) ? lastAfterNode : currentNode
    const node = session.insert(currentNode, session.insertionIdentity(currentNode, role), path, nodeKey, nodeContent, anchor, position, productTag)
    if (position === 'after') lastAfterNode = node
    return node
  }

  const controller: ASTController = {
    node: currentNode,
    nodes: () => styleNodes.slice(),
    productsByTag: (tag) => styleNodes.filter((node) => node.productTag === tag),
    retain: (node) => session.own(currentNode, node),
    removeNode: (node) => session.remove(node),
    sessionValue: (key, create) => session.value(key, create),
    findParent(matches, path = currentPath) {
      let result: JSSStyleNode | undefined
      let depth = -1
      for (const node of styleNodes) {
        if (!matches(node) || !isSemanticPathPrefix(node.conditionPath, path)) continue
        const candidateDepth = semanticPathParts(node.conditionPath).length
        if (candidateDepth > depth) { result = node; depth = candidateDepth }
      }
      return result
    },
    neighbors(matches, from = currentNode) {
      if (!styleNodes.includes(from)) return {}
      let previous: JSSStyleNode | undefined
      let passed = false
      for (const node of styleNodes) {
        if (node === from) { passed = true; continue }
        if (!matches(node)) continue
        if (passed) return { previous, next: node }
        previous = node
      }
      return { previous }
    },
    insertAt: (owner, identity, path, nodeKey, nodeContent) => session.insert(owner, `${owner.identity}/rewrite/${identity}`, path, nodeKey, nodeContent),
    moveBefore: (node, anchor) => session.moveBefore(node, anchor),
    revisit: (node) => session.revisit(node),
    onRemove: (node, cleanup) => session.onRemove(node, cleanup),
    defer: (message) => session.deferred.set(currentNode, new Error(message)),
    parseWaveIndex,
    conditionPath: currentPath,
    key,
    content,
    role,
    activate,
    withClaim: (value, build) => session.withClaim(currentNode, value, build),
    findByKey(nodeKey, path = currentPath) {
      const wantedName = propertyName(nodeKey)
      const target = path.targetConditionPath.map((item) => item.header)
      const states = path.stateConditionPath.map((state) => state.name)
      return styleNodes.find((node) => node.key !== undefined && propertyName(node.key) === wantedName
        && JSON.stringify(node.conditionPath.targetConditionPath.map((item) => item.header)) === JSON.stringify(target)
        && JSON.stringify(node.conditionPath.stateConditionPath.map((state) => state.name)) === JSON.stringify(states))
    },
    insert,
    detach: () => session.detach(currentNode),
    replaceResource(address) {
      for (let index = styleNodes.length - 1; index >= 0; index--) {
        if (styleNodes[index]?.resourceAddress === address) session.remove(styleNodes[index])
      }
    },
    insertResource(address, path, nodeKey, nodeContent) {
      const node = insert(path, nodeKey, nodeContent)
      node.resourceAddress = address
      return node
    },
  }
  return controller
}

/** 保存一次编译中的节点来源、共享产物和私有状态。 */
export class ASTSession {
  private owners = new Map<JSSStyleNode, Set<JSSStyleNode>>()
  private claims = new Map<object, Set<JSSStyleNode>>()
  private claimProducts = new Map<object, Set<JSSStyleNode>>()
  private claimStack: object[] = []
  private values = new Map<object, unknown>()
  private removalCallbacks = new WeakMap<JSSStyleNode, Set<() => void>>()
  private revisions = new WeakMap<JSSStyleNode, number>()
  deferred = new Map<JSSStyleNode, Error>()
  private insertionCounts = new WeakMap<JSSStyleNode, Map<string, number>>()
  private roots: Set<JSSStyleNode>
  private detachedNodes = new Set<JSSStyleNode>()

  constructor(public nodes: JSSStyleNode[]) {
    this.roots = new Set(nodes)
    nodes.forEach((node, index) => node.identity ??= `source/${index}`)
  }

  /** 按对象 Key 取得本次编译的私有值，首次访问时创建。 */
  value<T>(key: object, create: () => T): T {
    if (!this.values.has(key)) this.values.set(key, create())
    return this.values.get(key) as T
  }

  /** 给同一来源、解析角色下的连续插入分配不同身份。 */
  insertionIdentity(owner: JSSStyleNode, role: string): string {
    let counts = this.insertionCounts.get(owner)
    if (!counts) this.insertionCounts.set(owner, counts = new Map())
    const index = counts.get(role) ?? 0
    counts.set(role, index + 1)
    return `${owner.identity}/insert/${role}/${index}`
  }

  /** 记录节点来源；非源规则节点失去全部来源后随之移除。 */
  own(owner: JSSStyleNode, node: JSSStyleNode): void {
    if (owner === node) return
    let sources = this.owners.get(node)
    if (!sources) this.owners.set(node, sources = new Set())
    sources.add(owner)
    for (const key of this.claimStack) {
      let products = this.claimProducts.get(key)
      if (!products) this.claimProducts.set(key, products = new Set())
      products.add(node)
    }
  }

  /** 有存活来源时复用共享产物，否则重新执行构建。 */
  withClaim(owner: JSSStyleNode, key: object, build: () => void): void {
    const sources = this.claims.get(key)
    if (sources?.size) {
      sources.add(owner)
      for (const node of this.claimProducts.get(key) ?? []) {
        if (this.isAlive(node)) this.own(owner, node)
      }
      return
    }
    this.claims.set(key, new Set([owner]))
    this.claimStack.push(key)
    try { build() } finally { this.claimStack.pop() }
  }

  /** 展开入口不再输出，但它仍把祖先来源连接到产物。 */
  detach(node: JSSStyleNode): void {
    const index = this.nodes.indexOf(node)
    if (index < 0) return
    this.nodes.splice(index, 1)
    this.detachedNodes.add(node)
    this.deferred.delete(node)
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
    this.deferred.delete(node)
    for (const cleanup of this.removalCallbacks.get(node) ?? []) cleanup()
    this.removalCallbacks.delete(node)
    for (const [key, sources] of this.claims) {
      sources.delete(node)
      if (!sources.size) { this.claims.delete(key); this.claimProducts.delete(key) }
    }
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
    assert(this.nodes.length + nodes.length <= maximumStyleNodeCount, `AST 节点超过上限 ${maximumStyleNodeCount}，解析无法终止。`)
    this.nodes.splice(index, 0, ...nodes)
  }

  /** 将现存节点移到指定节点之前。 */
  moveBefore(node: JSSStyleNode, anchor: JSSStyleNode): void {
    const index = this.nodes.indexOf(node)
    const target = this.nodes.indexOf(anchor)
    if (index < 0 || target < 0 || index <= target) return
    this.nodes.splice(index, 1)
    this.nodes.splice(target, 0, node)
  }

  /** 标记节点供后续解析波重访。 */
  revisit(node: JSSStyleNode): void {
    if (!this.nodes.includes(node)) return
    this.revisions.set(node, this.version(node) + 1)
  }

  /** 返回节点的重访版本；未重访时为 0。 */
  version(node: JSSStyleNode): number { return this.revisions.get(node) ?? 0 }

  /** 登记节点撤销时执行的清理函数。 */
  onRemove(node: JSSStyleNode, cleanup: () => void): void {
    let callbacks = this.removalCallbacks.get(node)
    if (!callbacks) this.removalCallbacks.set(node, callbacks = new Set())
    callbacks.add(cleanup)
  }
}
