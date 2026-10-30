/**
 * 本次内容编译的按需资源账本。
 *
 * 收集内容激活的 Rules，完整提交同址替换和新增资源节点。
 *
 * 让共享资源保留全部存活消费者，并按生成时的规则身份关联。
 */
import { isObject, isString } from '@edsolater/fnkit'
import { propertyName } from '../../key'
import type { Rule, Rules } from '../../rule'
import type { JSSContentContext, JSSContent } from '../../content'
import { rulesToStyleNodes } from '../rules-to-style-nodes'
import type { ASTSession } from '../ast-controller'
import { condition, conditionAddressKey } from '../../condition'
import type { JSSStyleNode } from '../contracts'

/** 内容的一次激活及其规则产物；同一 Rule 身份可被多个激活记录共享。 */
interface ActivationRecord {
  rules: Rules
  nodes: JSSStyleNode[]
}

/**
 * 按条件地址与 Key 标识同址资源，让后激活的 Rules 替换旧资源。
 */
function ruleAddress(
  rule: Rule,
  identities: Map<string | symbol, number>,
): string {
  const [conditionPath, key, content] = rule
  const identity =
    isObject(content) && 'resourceIdentity' in content
      ? content.resourceIdentity
      : undefined
  if (identity !== undefined && !identities.has(identity))
    identities.set(identity, identities.size)
  return JSON.stringify([
    conditionAddressKey({
      targetConditionPath: (conditionPath ?? []).map((item) =>
        isString(item) ? condition(item) : item,
      ),
      stateConditionPath: [],
    }),
    key === undefined ? undefined : propertyName(key),
    identity === undefined ? undefined : identities.get(identity),
  ])
}

/** 本次编译的按需资源账本；激活保留消费者，波末完整提交同址替换与新增节点。 */
export class ResourceCompilation {
  private resourceIdentities = new Map<string | symbol, number>()
  private pendingRules = new Map<
    Rule,
    { owners: Set<JSSStyleNode>; order: number }
  >()
  private pendingOrder = 0
  private activatedContents = new Map<JSSContent, ActivationRecord>()
  private consumers = new Map<
    JSSStyleNode,
    Map<'key' | 'content', Set<JSSContent>>
  >()

  /**
   * 绑定当前编译的来源与输出队列，账本不跨编译共享。
   */
  constructor(private session: ASTSession) {}

  /**
   * 通知实际消费的内容，并收集它按需提供的 Rules。
   */
  activate(
    value: JSSContent,
    context: JSSContentContext,
    owner: JSSStyleNode,
  ): void {
    let record = this.activatedContents.get(value)
    if (!record) {
      record = { rules: value.onFirstScan?.(context) ?? [], nodes: [] }
      this.activatedContents.set(value, record)
    }
    const surviving = record.nodes.filter((node) =>
      this.session.hasOutput(node),
    )
    if (surviving.length) {
      surviving.forEach((node) => this.session.own(owner, node))
      return
    }
    for (const rule of record.rules) {
      let pending = this.pendingRules.get(rule)
      if (!pending)
        this.pendingRules.set(rule, (pending = { owners: new Set(), order: 0 }))
      pending.order = this.pendingOrder++
      pending.owners.add(owner)
    }
  }

  /**
   * 按实际访问收回旧激活；暂缓中的角色保留已取得的资源，直到产物完成。
   */
  updateConsumer(
    owner: JSSStyleNode,
    role: 'key' | 'content',
    contents: Set<JSSContent>,
    complete: boolean,
  ): void {
    let roles = this.consumers.get(owner)
    if (!roles) {
      this.consumers.set(owner, (roles = new Map()))
      this.session.onRemove(owner, () => this.consumers.delete(owner))
    }
    const previous = new Set(
      [...roles.values()].flatMap((values) => [...values]),
    )
    const current = complete
      ? contents
      : new Set([...(roles.get(role) ?? []), ...contents])
    roles.set(role, current)
    const retained = new Set(
      [...roles.values()].flatMap((values) => [...values]),
    )
    const retainedNodes = new Set(
      [...retained].flatMap(
        (value) => this.activatedContents.get(value)?.nodes ?? [],
      ),
    )
    for (const value of previous) {
      if (retained.has(value)) continue
      for (const node of this.activatedContents.get(value)?.nodes ?? []) {
        if (!retainedNodes.has(node)) this.session.release(owner, node)
      }
    }
    // 本波尚未发布的资源也必须撤回失效来源，避免发布后再留下孤儿产物。
    const retainedRules = new Set(
      [...retained].flatMap(
        (value) => this.activatedContents.get(value)?.rules ?? [],
      ),
    )
    for (const [rule, pending] of this.pendingRules) {
      if (!retainedRules.has(rule)) pending.owners.delete(owner)
    }
  }
  /**
   * 按需资源记录每一个消费者，改写撤销不影响其他消费者。
   */
  private createDependencyNodes(): JSSStyleNode[] {
    const grouped = new Map<
      string,
      {
        rule: Rule
        owners: Set<JSSStyleNode>
        records: Set<ActivationRecord>
        order: number
      }
    >()
    for (const [rule, contribution] of this.pendingRules) {
      const owners = [...contribution.owners].filter((owner) =>
        this.session.isAlive(owner),
      )
      if (!owners.length) continue
      const address = ruleAddress(rule, this.resourceIdentities)
      let entry = grouped.get(address)
      if (!entry)
        grouped.set(
          address,
          (entry = {
            rule,
            owners: new Set(),
            records: new Set(),
            order: contribution.order,
          }),
        )
      for (const owner of owners) entry.owners.add(owner)
      if (contribution.order > entry.order) {
        entry.rule = rule
        entry.order = contribution.order
      }
    }
    const pending = [...grouped.entries()]
    this.pendingRules.clear()
    this.pendingOrder = 0
    if (!pending.length) return []
    const finalRules = new Map<Rule, Set<ActivationRecord>>()
    for (const [, entry] of pending) {
      let records = finalRules.get(entry.rule)
      if (!records) finalRules.set(entry.rule, (records = entry.records))
      else entry.records = records
    }
    // 生成时读取各记录的当前 Rules；一次收集精确身份关系，产物不再逐项反查。
    for (const record of this.activatedContents.values()) {
      for (const rule of record.rules) finalRules.get(rule)?.add(record)
    }
    return pending.flatMap(([address, entry]) => {
      return rulesToStyleNodes([entry.rule]).map((node, index) => {
        Object.defineProperty(node, 'resourceAddress', {
          configurable: true,
          enumerable: true,
          get: () => ruleAddress(entry.rule, this.resourceIdentities),
        })
        node.identity = `dependency/${address}/${index}`
        for (const owner of entry.owners) this.session.own(owner, node)
        for (const record of entry.records) record.nodes.push(node)
        return node
      })
    })
  }

  /**
   * 将本波按需 Rules 按当前记录关联生成、撤销同址旧资源并接入下一波。
   */
  publish(): void {
    const dependencyStyleNodes = this.createDependencyNodes()
    const replacedResources = new Set(
      dependencyStyleNodes.flatMap((node) =>
        node.resourceAddress === undefined ? [] : [node.resourceAddress],
      ),
    )
    if (replacedResources.size) {
      for (let index = this.session.nodes.length - 1; index >= 0; index--) {
        const address = this.session.nodes[index]?.resourceAddress
        if (address !== undefined && replacedResources.has(address))
          this.session.remove(this.session.nodes[index])
      }
    }
    this.session.append(dependencyStyleNodes)
  }
}
