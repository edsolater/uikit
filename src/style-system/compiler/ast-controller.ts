/** 编译会话的 AST 控制器与节点来源管理。
 *
 * 提供节点查询、输入变化通知、队列编辑与级联撤销。
 *
 * 让编译行为共用显式位置和存活来源，保留输出退出的区别。
 */
import { assert, isObjectLike } from '@edsolater/fnkit'
import { createCompiledValue } from './compiled-value'
import type { Value } from '../value'
import { conditionAddressKey, type ConditionPath } from '../condition'
import { keyPriority, propertyName, type JSSKey } from '../key'
import type { JSSCompileContext } from '../content'
import type { JSSStyleNode, ASTController, ASTQuery, ASTPosition, ContentCompilationRecord } from './contracts'

/** 一个声明角色的原输入与各嵌套内容记录。 */
export interface RoleCompilationState {
  input: unknown
  contents: WeakMap<object, ContentCompilationRecord>
  visitedContents: Set<object>
  complete: boolean
}

/** 本次会话中一个节点的两个角色及失效版本。 */
export interface StyleNodeCompileState {
  version: number
  address: string
  key: RoleCompilationState
  content: RoleCompilationState
}

const maximumStyleNodeCount = 100_000

/** 为本次编译建立无当前位置的队列控制器。 */
export function createASTController(session: ASTSession): ASTController {
  /** 固定本次查询的名称与地址，为收集与存在判断提供同一匹配规则。 */
  const matching = (query: ASTQuery): (node: JSSStyleNode) => boolean => {
    const name = query.key === undefined ? undefined : propertyName(query.key)
    const address = query.conditionPath === undefined ? undefined : conditionAddressKey(query.conditionPath)
    const root = (path: ConditionPath): boolean => !path.stateConditionPath.length && path.targetConditionPath.length === 1
      && [':root', ':where(:root)'].includes(path.targetConditionPath[0].header)
    return (node) =>
      (name === undefined || (node.key !== undefined && propertyName(node.key) === name)) &&
      (address === undefined || conditionAddressKey(node.conditionPath) === address
        || query.conditionPath !== undefined && root(query.conditionPath) && root(node.conditionPath)) &&
      (query.productTag === undefined || node.productTag === query.productTag) &&
      (query.resourceAddress === undefined || node.resourceAddress === query.resourceAddress)
  }
  return {
    setContent(context, content) {
      const role = context.role === 'declaration-key' ? 'key' : 'content'
      const record = session.compilations.get(context.node)?.[role].contents.get(context.input)
      assert(session.isAlive(context.node) && record?.notifyingContext === context, '只能操作当前通知的内容位置。')
      record.content = content
    },
    /** 读取角色访问已留下的事实，不触发新的内容求值。 */
    getCompiledContent: (node, input) => {
      if (!isObjectLike(input)) return input
      const record = session.compilations.get(node)?.content.contents.get(input)
      return record ? record.content : input
    },
    /** 将当前位置已完成的记录交付给输出视图，不执行内容。 */
    getCompiledValue: (node, input) => createCompiledValue(input, session.compilations.get(node)!.content.contents),
    /** 只查询已有位置事实，供分析读取依赖及核对失效身份。 */
    getContentCompilation: (node, input) => isObjectLike(input)
      ? session.compilations.get(node)?.content.contents.get(input) : undefined,
    usesContent: (node, input) => {
      if (!isObjectLike(input)) return false
      const state = session.compilations.get(node)
      return Boolean(state?.key.visitedContents.has(input) || state?.content.visitedContents.has(input))
    },
    search: (query) => session.nodes.filter(matching(query)),
    has: (query) => session.nodes.some(matching(query)),
    findDeclaration(query, accept) {
      const matches = matching(query)
      let selected: JSSStyleNode | undefined
      for (const node of session.nodes) {
        if (!matches(node) || !accept(node)) continue
        if (!selected) { selected = node; continue }
        const rootSpecificity = (node: JSSStyleNode) => node.conditionPath.targetConditionPath.length === 1
          && node.conditionPath.targetConditionPath[0].header === ':root' ? 1 : 0
        const rank = rootSpecificity(node) - rootSpecificity(selected)
          || keyPriority(node.key!) - keyPriority(selected.key!) || session.compareOrder(node, selected)
        if (rank > 0) selected = node
      }
      return selected
    },
    nodes: () => session.nodes.slice(),
    observeNodes: observe => session.observeNodes(observe),
    compareOrder: (left, right) => session.compareOrder(left, right),
    insert(position, [key, content], provenance) {
      const direction = position.after ? 'after' : 'before'
      const anchor = position.before ?? position.after!
      const identity = provenance.identity === undefined
        ? session.insertionIdentity(provenance.owner)
        : `${provenance.owner.identity}/rewrite/${provenance.identity}`
      return session.insert(provenance.owner, identity, position.conditionPath, key, content, anchor, direction, provenance.productTag, node => {
        node.resourceAddress = provenance.resourceAddress
        provenance.initialize?.(node)
      })
    },
    move: (node, position) => session.move(node, position.before ?? position.after!, position.after ? 'after' : 'before'),
    remove: (node, options) => options?.from === 'output' ? session.detach(node) : session.remove(node),
    depend: (node, options) => session.own(options.owner, node),
    release: (node, options) => session.release(options.owner, node),
    onRemove: (node, cleanup) => session.onRemove(node, cleanup),
    defer: (node, message) => { node.deferredReason = new Error(message) },
    addSettlementCheck: check => session.settlementChecks.add(check),
  }
}

/** 保存一次编译中的节点来源和撤销生命周期。 */
export class ASTSession {
  identity: object = {}
  /** 本次节点编译的唯一位置账本；节点编译维护进度，Controller 操作其中的当前内容。 */
  compilations = new WeakMap<JSSStyleNode, StyleNodeCompileState>()
  settlementChecks = new Set<() => boolean>()
  private owners = new Map<JSSStyleNode, Set<JSSStyleNode>>()
  private products = new Map<JSSStyleNode, Set<JSSStyleNode>>()
  private removalCallbacks = new WeakMap<JSSStyleNode, Set<() => void>>()
  private insertionCounts = new WeakMap<JSSStyleNode, number>()
  private roots: Set<JSSStyleNode>
  private liveNodes: Set<JSSStyleNode>
  private outputNodes: Set<JSSStyleNode>
  private nodeObservers = new Set<(node: JSSStyleNode, present: boolean) => void>()
  private trackedNodes = new WeakSet<JSSStyleNode>()
  private order = new WeakMap<JSSStyleNode, number>()

  constructor(public nodes: JSSStyleNode[]) {
    this.roots = new Set(nodes)
    this.liveNodes = new Set(nodes)
    this.outputNodes = new Set(nodes)
    nodes.forEach((node, index) => {
      node.identity ??= `source/${index}`
      node.compileRevision ??= 0
      this.order.set(node, index)
      this.track(node)
    })
  }

  /**
   * 按现有顺序交付节点并订阅后续改变；事实来自AST编辑和节点输入本身。
   */
  observeNodes(observe: (node: JSSStyleNode, present: boolean) => void): void {
    this.nodeObservers.add(observe)
    for (const node of this.nodes) observe(node, true)
  }

  /**
   * 返回两个输出位置的先后关系；仅顺序改变时调整位置，不在查询时搜索节点。
   */
  compareOrder(left: JSSStyleNode, right: JSSStyleNode): number {
    return this.order.get(left)! - this.order.get(right)!
  }

  /**
   * 当前节点的输入改写直接通知受体；保留原对象与可写字段，不另存一份节点内容。
   */
  private track(node: JSSStyleNode): void {
    if (this.trackedNodes.has(node)) return
    this.trackedNodes.add(node)
    for (const field of ['key', 'content', 'compileRevision', 'conditionPath', 'aggregate'] as const) {
      let input = node[field]
      Object.defineProperty(node, field, { enumerable: true, configurable: true,
        get: () => input,
        set: value => {
          if (input === value) return
          input = value
          delete node.deferredReason
          this.notify(node)
        },
      })
    }
  }

  /**
   * 向编译期受体交付节点当前存在状态；没有受体时不产生后续工作。
   */
  private notify(node: JSSStyleNode): void {
    for (const observe of this.nodeObservers) observe(node, this.hasOutput(node))
  }

  /**
   * 为一段新位置保留相邻顺序；数字间距耗尽时统一重编号，不影响任何声明身份。
   */
  private position(nodes: JSSStyleNode[], index: number): void {
    const before = this.order.get(this.nodes[index - 1]) ?? (this.order.get(this.nodes[index + nodes.length]) ?? 0) - 1
    const after = this.order.get(this.nodes[index + nodes.length]) ?? before + nodes.length + 1
    const step = (after - before) / (nodes.length + 1)
    if (before + step === before || after - step === after) {
      this.nodes.forEach((node, order) => this.order.set(node, order))
    } else nodes.forEach((node, offset) => this.order.set(node, before + step * (offset + 1)))
  }

  /** 当前全部内容完成后核对队列；任何新增或撤销仍由同一编译流程处理。 */
  updateSettlement(): boolean {
    let changed = false
    for (const check of this.settlementChecks) {
      const updated = check()
      changed ||= updated
    }
    return changed
  }

  /** 给同一来源的连续插入分配不同身份，无需知道调用角色。 */
  insertionIdentity(owner: JSSStyleNode): string {
    const index = this.insertionCounts.get(owner) ?? 0
    this.insertionCounts.set(owner, index + 1)
    return `${owner.identity}/insert/${index}`
  }

  /** 记录存活来源，拒绝已撤销来源；仅退出输出仍允许，非源产物失去全部来源后移除。 */
  own(owner: JSSStyleNode, node: JSSStyleNode): void {
    assert(this.isAlive(owner), '不能登记已撤销来源的依赖。')
    if (owner === node) return
    let sources = this.owners.get(node)
    if (!sources) this.owners.set(node, sources = new Set())
    sources.add(owner)
    let products = this.products.get(owner)
    if (!products) this.products.set(owner, products = new Set())
    products.add(node)
  }

  /** 只解除一条来源边，不撤销仍有其他来源的产物或原始声明。 */
  release(owner: JSSStyleNode, node: JSSStyleNode): void {
    const products = this.products.get(owner)
    products?.delete(node)
    if (!products?.size) this.products.delete(owner)
    const sources = this.owners.get(node)
    if (!sources?.delete(owner)) return
    if (!sources.size) {
      this.owners.delete(node)
      if (!this.roots.has(node)) this.remove(node)
    }
  }

  /** 展开入口不再输出，但它仍把祖先来源连接到产物。 */
  detach(node: JSSStyleNode): void {
    const index = this.nodes.indexOf(node)
    if (index < 0) return
    this.nodes.splice(index, 1)
    this.outputNodes.delete(node)
    this.notify(node)
    delete node.deferredReason
  }

  /** 已脱离输出的展开入口仍是有效来源，级联撤销后才失效。 */
  isAlive(node: JSSStyleNode): boolean {
    return this.liveNodes.has(node)
  }

  /** 判断节点是否仍在有序输出队列中；已退出输出的来源仍可存活。 */
  hasOutput(node: JSSStyleNode): boolean {
    return this.outputNodes.has(node)
  }

  /** 删除指定产物及失去全部存活来源的后继，保留共享消费者的依赖。 */
  remove(node: JSSStyleNode): void {
    if (!this.isAlive(node)) return
    const index = this.hasOutput(node) ? this.nodes.indexOf(node) : -1
    if (index >= 0) this.nodes.splice(index, 1)
    this.liveNodes.delete(node)
    this.outputNodes.delete(node)
    this.notify(node)
    for (const owner of this.owners.get(node) ?? []) {
      const products = this.products.get(owner)
      products?.delete(node)
      if (!products?.size) this.products.delete(owner)
    }
    this.owners.delete(node)
    this.roots.delete(node)
    delete node.deferredReason
    for (const cleanup of this.removalCallbacks.get(node) ?? []) cleanup()
    this.removalCallbacks.delete(node)
    const products = this.products.get(node)
    this.products.delete(node)
    for (const child of products ?? []) {
      const sources = this.owners.get(child)
      sources?.delete(node)
      if (!sources?.size && !this.roots.has(child)) this.remove(child)
    }
  }

  /** 所有即时插入共用节点创建、来源登记和位置处理。 */
  insert(owner: JSSStyleNode, identity: string, path: ConditionPath, key: JSSKey | undefined, content: unknown, anchor = owner, position: 'before' | 'after' = 'before', productTag?: object, initialize?: (node: JSSStyleNode) => void): JSSStyleNode {
    const index = this.nodes.indexOf(anchor)
    assert(index >= 0 && this.isAlive(owner), '不能在已撤销或已脱离输出的节点位置生成内容。')
    const node: JSSStyleNode = {
      identity,
      compileRevision: 0,
      conditionPath: {
        targetConditionPath: [...path.targetConditionPath],
        stateConditionPath: [...path.stateConditionPath],
      },
      key,
      content,
      productTag,
    }
    initialize?.(node)
    this.own(owner, node)
    this.append([node], index + (position === 'after' ? 1 : 0))
    return node
  }

  /** 已展开的依赖节点也通过同一入口进入输出队列。 */
  append(nodes: JSSStyleNode[], index = this.nodes.length): void {
    assert(this.nodes.length + nodes.length <= maximumStyleNodeCount, `AST 节点超过上限 ${maximumStyleNodeCount}，编译无法终止。`)
    this.nodes.splice(index, 0, ...nodes)
    this.position(nodes, index)
    for (const node of nodes) {
      this.liveNodes.add(node)
      this.outputNodes.add(node)
      this.track(node)
      this.notify(node)
    }
  }

  /** 将现存节点紧邻锚点放置，不改变地址或来源。 */
  move(node: JSSStyleNode, anchor: JSSStyleNode, position: 'before' | 'after'): void {
    if (node === anchor || !this.hasOutput(node) || !this.hasOutput(anchor)) return
    const previous = this.nodes.indexOf(node)
    if (previous === this.nodes.indexOf(anchor) + (position === 'after' ? 1 : -1)) return
    this.nodes.splice(previous, 1)
    const index = this.nodes.indexOf(anchor) + (position === 'after' ? 1 : 0)
    this.nodes.splice(index, 0, node)
    this.position([node], index)
    this.notify(node)
  }

  /** 登记节点撤销时执行的清理函数。 */
  onRemove(node: JSSStyleNode, cleanup: () => void): void {
    let callbacks = this.removalCallbacks.get(node)
    if (!callbacks) this.removalCallbacks.set(node, callbacks = new Set())
    callbacks.add(cleanup)
  }
}
