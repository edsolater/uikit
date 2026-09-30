/** 本次内容编译的按需资源账本。
 *
 * 收集内容激活的 Rules，完整提交同址替换和新增资源节点。
 *
 * 让共享资源保留全部存活消费者，并按生成时的规则身份关联。
 */
import { propertyName } from '../../key'
import type { Rule, Rules } from '../../rule'
import type { JSSContentContext, JSSContent } from '../../content'
import { rulesToStyleNodes, type JSSStyleNode } from '../rules-to-style-nodes'
import type { ASTSession } from '../ast-controller'

/** 内容的一次激活及其规则产物；同一 Rule 身份可被多个激活记录共享。 */
interface ActivationRecord {
  rules: Rules
  nodes: JSSStyleNode[]
}

/** 按条件地址与 Key 标识同址资源，让后激活的 Rules 替换旧资源。 */
function ruleAddress(rule: Rule, identities: Map<string | symbol, number>): string {
  const [conditionPath, key, content] = rule
  const identity = content && typeof content === 'object' && 'resourceIdentity' in content ? content.resourceIdentity : undefined
  if (identity !== undefined && !identities.has(identity)) identities.set(identity, identities.size)
  return JSON.stringify([
    conditionPath?.map((item) => typeof item === 'string' ? item : item.header),
    key === undefined ? undefined : propertyName(key),
    identity === undefined ? undefined : identities.get(identity),
  ])
}

/** 本次编译的按需资源账本；激活保留消费者，波末完整提交同址替换与新增节点。 */
export class ResourceCompilation {
  private resourceIdentities = new Map<string | symbol, number>()
  private pendingRules = new Map<string, { rule: Rule; owners: Set<JSSStyleNode>; records: Set<ActivationRecord> }>()
  private activatedContents = new Map<JSSContent, ActivationRecord>()

  /** 绑定当前编译的来源与输出队列，账本不跨编译共享。 */
  constructor(private session: ASTSession) {}

  /** 通知实际消费的内容，并收集它按需提供的 Rules。 */
  activate(value: JSSContent, context: JSSContentContext, owner: JSSStyleNode): void {
    let record = this.activatedContents.get(value)
    if (!record) {
      record = { rules: value.onActive?.(context) ?? [], nodes: [] }
      this.activatedContents.set(value, record)
    }
    const surviving = record.nodes.filter((node) => this.session.hasOutput(node))
    if (surviving.length) {
      surviving.forEach((node) => this.session.own(owner, node))
      return
    }
    for (const rule of record.rules) {
      const address = ruleAddress(rule, this.resourceIdentities)
      let pending = this.pendingRules.get(address)
      if (!pending) this.pendingRules.set(address, pending = { rule, owners: new Set(), records: new Set() })
      pending.rule = rule
      pending.owners.add(owner)
    }
  }
  /** 按需资源记录每一个消费者，改写撤销不影响其他消费者。 */
  private createDependencyNodes(): JSSStyleNode[] {
    const pending = [...this.pendingRules.entries()]
    this.pendingRules.clear()
    if (!pending.length) return []
    const finalRules = new Map<Rule, Set<ActivationRecord>>()
    for (const [, entry] of pending) {
      let records = finalRules.get(entry.rule)
      if (!records) finalRules.set(entry.rule, records = entry.records)
      else entry.records = records
    }
    // 生成时读取各记录的当前 Rules；一次收集精确身份关系，产物不再逐项反查。
    for (const record of this.activatedContents.values()) {
      for (const rule of record.rules) finalRules.get(rule)?.add(record)
    }
    return pending.flatMap(([address, entry]) => {
      const owners = [...entry.owners].filter((owner) => this.session.isAlive(owner))
      if (!owners.length) return []
      return rulesToStyleNodes([entry.rule]).map((node, index) => {
        node.resourceAddress = address
        node.identity = `dependency/${address}/${index}`
        for (const owner of owners) this.session.own(owner, node)
        for (const record of entry.records) record.nodes.push(node)
        return node
      })
    })
  }

  /** 将本波按需 Rules 按当前记录关联生成、撤销同址旧资源并接入下一波。 */
  publish(): void {
    const dependencyStyleNodes = this.createDependencyNodes()
    const replacedResources = new Set(dependencyStyleNodes.flatMap((node) => node.resourceAddress === undefined ? [] : [node.resourceAddress]))
    if (replacedResources.size) {
      for (let index = this.session.nodes.length - 1; index >= 0; index--) {
        const address = this.session.nodes[index]?.resourceAddress
        if (address !== undefined && replacedResources.has(address)) this.session.remove(this.session.nodes[index])
      }
    }
    this.session.append(dependencyStyleNodes)
  }
}
