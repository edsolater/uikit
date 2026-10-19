/** 本次内容编译的同址声明连接器。
 *
 * 核对有序输入快照、连接贡献并维护结果历史与输出选择。
 *
 * 让隐藏结果保留依赖来源，失效时完整撤销全部历史。
 */
import { createCompiledValue } from '../compiled-value'
import { assert } from '@edsolater/fnkit'
import { conditionAddressKey } from '../../condition'
import { keyPriority, propertyName, type JSSKey, type JSSKeyObject } from '../../key'
import type { JSSStyleNode } from '../rules-to-style-nodes'
import type { ASTSession, ContentCompilationRecord } from '../ast-controller'
import { contentToCSSString } from '../content-nodes-to-css-string'
import { value } from '../../value'

/** 业务连接回调前的一项声明输入；用于生成本次结果并核对后续失效。 */
interface InputSnapshot {
  key: JSSKey | undefined
  join: JSSKeyObject['join']
  content: unknown
  revision: number
  priority: number
  effective: boolean
}

/** 同址连接的输入快照与结果历史；输入 Map 保留贡献顺序，最后结果输出，旧结果保留依赖来源。 */
interface JoinRecord {
  inputs: Map<JSSStyleNode, InputSnapshot>
  anchor: JSSStyleNode
  results: JSSStyleNode[]
}

/**
 * 捕获有序输入，一次选择最高等级有效贡献、连接规则及其最后位置。
 * 输掉的贡献仍保留失效快照，不改变获选声明与状态之间的顺序。
 */
function captureInputs(nodes: Iterable<JSSStyleNode>, compiledContents: (node: JSSStyleNode) => WeakMap<object, ContentCompilationRecord>): {
  inputs: Map<JSSStyleNode, InputSnapshot>
  selected: Map<JSSStyleNode, InputSnapshot>
  anchor: JSSStyleNode
  join: JSSKeyObject['join']
} {
  const inputs = new Map<JSSStyleNode, InputSnapshot>()
  for (const node of nodes) {
    inputs.set(node, {
      key: node.key,
      join: typeof node.key === 'string' ? undefined : node.key?.join,
      content: node.content,
      revision: node.compileRevision,
      priority: keyPriority(node.key),
      effective: contentToCSSString(node.content, compiledContents(node)) !== undefined,
    })
  }
  const priority = Math.max(...[...inputs.values()].filter(input => input.effective).map(input => input.priority))
  const selected = new Map([...inputs].filter(([, input]) => input.effective && input.priority === priority))
  const joiners = new Set([...selected.values()].flatMap(input => input.join ? [input.join] : []))
  const first = [...inputs.keys()][0]
  assert(joiners.size <= 1, `同名 JSSKey 的组合规则冲突：${propertyName(inputs.get(first)!.key!)}。`)
  return { inputs, selected, anchor: [...selected.keys()].at(-1) ?? [...inputs.keys()].at(-1)!, join: [...joiners][0] }
}

/** 本次编译的同址连接；拥有输入快照与历史来源，只选择最新结果输出。 */
export class Join {
  private records = new Map<string, JoinRecord>()
  private recordOf = new WeakMap<JSSStyleNode, JoinRecord>()

  /** 绑定当前队列及原贡献已经完成的解析结果，不接管内容编译进度。 */
  constructor(private session: ASTSession, private compiledContents: (node: JSSStyleNode) => WeakMap<object, ContentCompilationRecord>) {}

  /** 稳定队列中撤销失效历史或组合新增贡献；有变更时结果须进入后续编译波。 */
  update(): boolean {
    const groups = this.collectGroups()
    if (this.invalidate(groups)) return true
    let changed = false
    for (const [address, group] of groups) if (this.join(address, group)) changed = true
    return changed
  }

  /** 仅选择连接后的输出位置；存活与角色完成度仍由节点编译负责。 */
  isOutput(node: JSSStyleNode): boolean {
    const record = this.recordOf.get(node)
    return !record || record.results.at(-1) === node
  }

  /** 从当前输出队列收集原贡献及其顺序，不把历史结果再次算作输入。 */
  private collectGroups(): Map<string, Map<JSSStyleNode, number>> {
    const groups = new Map<string, Map<JSSStyleNode, number>>()
    for (const node of this.session.nodes) {
      const record = this.recordOf.get(node)
      if (node.key === undefined || (record && !record.inputs.has(node))) continue
      const address = JSON.stringify([conditionAddressKey(node.conditionPath), propertyName(node.key)])
      let group = groups.get(address)
      if (!group) groups.set(address, group = new Map())
      group.set(node, group.size)
    }

    return groups
  }

  /** 核对本次输入位置、Key、join、Content 与 revision 是否仍保留原快照。 */
  private matches(record: JoinRecord, group: Map<JSSStyleNode, number> | undefined): boolean {
    let previousPosition = -1
    for (const [node, snapshot] of record.inputs) {
      const position = group?.get(node)
      if (position === undefined || position <= previousPosition || node.key !== snapshot.key
        || (typeof node.key === 'string' ? undefined : node.key?.join) !== snapshot.join
        || node.content !== snapshot.content || node.compileRevision !== snapshot.revision || keyPriority(node.key) !== snapshot.priority) {
        return false
      }
      previousPosition = position
    }
    return true
  }

  /** 撤销全部失效历史和输入定位；清理可能编辑队列，之后必须重新分组。 */
  private invalidate(groups: Map<string, Map<JSSStyleNode, number>>): boolean {
    let changed = false
    for (const [address, record] of this.records) {
      const group = groups.get(address)
      const latest = record.results.at(-1)!
      if (this.matches(record, group) && this.session.isAlive(latest)) {
        this.session.move(latest, record.anchor, 'after')
        continue
      }
      for (const result of [...record.results].reverse()) {
        this.session.remove(result)
        this.recordOf.delete(result)
      }
      for (const input of record.inputs.keys()) this.recordOf.delete(input)
      this.records.delete(address)
      changed = true
    }
    return changed
  }

  /** 为至少两项贡献连接一次结果；以业务回调前的实际输入登记快照与历史来源。 */
  private join(address: string, group: Map<JSSStyleNode, number>): boolean {
    if (group.size < 2) return false
    const previous = this.records.get(address)
    if (previous && previous.inputs.size === group.size) return false
    const { inputs, selected, anchor, join } = captureInputs(group.keys(), this.compiledContents)
    const content = this.createContent(selected, join)
    this.publish(address, inputs, anchor, content, previous)
    return true
  }

  /**
   * 只为已选择的同级贡献建立位置 Value 视图，再调用原 Key.join 或默认数组聚合。
   */
  private createContent(selected: Map<JSSStyleNode, InputSnapshot>, join: JSSKeyObject['join']): unknown {
    const values = Array.from(selected, ([node, input]) => createCompiledValue(input.content, this.compiledContents(node)))
    return join ? join(values) : value(values)
  }

  /**
   * 将结果放在获选贡献的最后位置，全部输入继续作为来源参与撤销与恢复。
   */
  private publish(address: string, inputs: Map<JSSStyleNode, InputSnapshot>, anchor: JSSStyleNode, content: unknown, previous: JoinRecord | undefined): void {
    const result = this.session.insert(anchor, this.session.insertionIdentity(anchor), anchor.conditionPath, inputs.get(anchor)!.key, content, anchor, 'after', undefined,
      node => { node.aggregate = true })
    const record = previous ?? { inputs, anchor, results: [] }
    record.inputs = inputs
    record.anchor = anchor
    for (const node of inputs.keys()) {
      this.session.own(node, result)
      this.recordOf.set(node, record)
    }
    record.results.push(result)
    this.recordOf.set(result, record)
    this.records.set(address, record)
  }

}
