/** JSS 样式节点的内容编译器。
 *
 * 逐波推进内容、依赖与聚合，交付可输出的内容节点。
 *
 * 让可改写的声明完成全部内容行为后再进入 CSS 输出。
 */
import { assert, hasProperty, isArray, isFunction, isObjectLike } from '@edsolater/fnkit'
import { conditionAddressKey, outputConditionPath, type ConditionPath, type CSSConditionPath } from '../condition'
import { propertyName, type JSSKey, type JSSKeyObject } from '../key'
import type { Rule, Rules } from '../rule'
import { hasJSSContentOnCompileMethod, hasJSSContentOutput, type JSSContentContext, type JSSCompileContext, type JSSContent } from '../content'
import { rulesToStyleNodes, type JSSStyleNode } from './rules-to-style-nodes'
import { createASTController, ASTSession, type ASTController } from './ast-controller'
import { contentToCSSString } from './content-nodes-to-css-string'
import { value, type Value, type ValueData } from '../value'

/** 一项已完成编译的声明；保留内容对象和子内容的编译结果供输出阶段读取。 */
export interface JSSContentNode {
  conditionPath: CSSConditionPath
  key: JSSKey | undefined
  content: unknown
  resolvedContents: WeakMap<object, unknown>
}


/** 分别记录节点的 Key 与 Content 编译进度；任一内容被替换后重访对应位置。 */
interface StyleNodeCompileState {
  version: number
  keyProgress: WeakMap<object, ContentVisitResult>
  contentProgress: WeakMap<object, ContentVisitResult>
  contentReplacements: WeakMap<object, unknown>
  keySnapshot: unknown
  contentSnapshot: unknown
  keyComplete: boolean
  contentComplete: boolean
}

/** 内容访问的返回值与完成度；回调已调用后保留此进度，后续波继续访问未完成的替代链。 */
interface ContentVisitResult {
  content: unknown
  complete: boolean
}

/** 本次编译允许调用 onCompile 的总次数。 */
interface CompileBudget {
  operations: number
  maximumOperations: number
}

/** 内容的一次激活及其规则产物；同一 Rule 身份可被多个激活记录共享。 */
interface ActivationRecord {
  rules: Rules
  nodes: JSSStyleNode[]
}

/** 聚合输入在本次组合时的完整快照；Map 顺序就是原贡献顺序。 */
interface AggregationInput {
  key: JSSKey | undefined
  join: JSSKeyObject['join']
  content: unknown
  revision: number
}

/** 同址聚合拥有输入快照与结果历史；最后一个结果输出，旧结果保留依赖来源。 */
interface AggregationRecord {
  inputs: Map<JSSStyleNode, AggregationInput>
  results: JSSStyleNode[]
}

/** 在当前编译波访问 Key 或 Content 链，交回当前位置的内容及是否仍需后续波。 */
function visitContent(
  input: unknown,
  context: JSSCompileContext,
  controller: ASTController,
  compileWaveIndex: number,
  progress: WeakMap<object, ContentVisitResult>,
  replacements: WeakMap<object, unknown> | undefined,
  activeObjects: Set<object>,
  budget: CompileBudget,
  activate: (content: JSSContent) => void,
  depth = 0,
): ContentVisitResult {
  assert(depth <= 256, 'Content 编译嵌套超过上限 256，编译无法终止。')
  if (input === undefined || typeof input === 'string' || typeof input === 'number') return { content: input, complete: true }
  assert(isObjectLike(input), '无效的 CSS 内容。')
  assert(!activeObjects.has(input), 'CSS 内容存在循环引用，无法生成 CSS。')
  activeObjects.add(input)
  try {
    if (hasProperty(input, 'onActive', isFunction)) activate(input)

    if (hasJSSContentOnCompileMethod(input)) {
      let previous = progress.get(input)
      const earliestWave = input.compileWaveIndex ?? 0
      assert(Number.isInteger(earliestWave) && earliestWave >= 0, 'compileWaveIndex 必须是非负整数。')
      if (!previous && earliestWave > compileWaveIndex) {
        visitChildren(input, context, controller, compileWaveIndex, progress, replacements, activeObjects, budget, activate, depth)
        return { content: input, complete: false }
      }
      if (!previous) {
        budget.operations++
        assert(budget.operations <= budget.maximumOperations, `AST 编译操作超过上限 ${budget.maximumOperations}，编译无法终止。`)
        previous = { content: input.onCompile(context, controller), complete: false }
        progress.set(input, previous)
      }
      const result = previous.content === input
        ? visitChildren(input, context, controller, compileWaveIndex, progress, replacements, activeObjects, budget, activate, depth)
        : visitContent(previous.content, context, controller, compileWaveIndex, progress, replacements, activeObjects, budget, activate, depth + 1)
      progress.set(input, result)
      if (result.complete && result.content !== input) replacements?.set(input, result.content)
      return result
    }

    return visitChildren(input, context, controller, compileWaveIndex, progress, replacements, activeObjects, budget, activate, depth)
  } finally {
    activeObjects.delete(input)
  }
}

/** 访问依赖并判断当前输出；无输出对象等待依赖完成后才从内容链消失。 */
function visitChildren(
  input: object,
  context: JSSCompileContext,
  controller: ASTController,
  compileWaveIndex: number,
  progress: WeakMap<object, ContentVisitResult>,
  replacements: WeakMap<object, unknown> | undefined,
  activeObjects: Set<object>,
  budget: CompileBudget,
  activate: (content: JSSContent) => void,
  depth: number,
): ContentVisitResult {
  const dependencyValue = 'dependencies' in input ? input.dependencies : undefined
  const dependencies = isArray(dependencyValue) ? dependencyValue : undefined
  let complete = true
  if (dependencies) {
    for (const child of dependencies) {
      const result = visitContent(child, context, controller, compileWaveIndex, progress, replacements, activeObjects, budget, activate, depth + 1)
      if (result.complete && result.content !== child && isObjectLike(child)) replacements?.set(child, result.content)
      complete &&= result.complete
    }
  }

  if (hasJSSContentOutput(input)) return { content: input, complete }
  if (hasJSSContentOnCompileMethod(input)) return { content: input, complete }
  if (dependencies || hasProperty(input, 'onActive', isFunction)) {
    return { content: complete ? undefined : input, complete }
  }
  throw new Error('无效的 CSS 内容。')
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

/** 逐波编译可改写队列；按需 Rules 进入后续波，完成后返回有序内容节点。 */
export function styleNodesToContentNodes(styleNodes: JSSStyleNode[], sourceRules: Rules): JSSContentNode[] {
  const session = new ASTSession(styleNodes)
  const controller = createASTController(session)
  const resourceIdentities = new Map<string | symbol, number>()
  const pendingRules = new Map<string, { rule: Rule; owners: Set<JSSStyleNode>; records: Set<ActivationRecord> }>()
  const activatedContents = new Map<JSSContent, ActivationRecord>()
  /** 通知实际消费的内容，并收集它按需提供的 Rules。 */
  const activate = (value: JSSContent, context: JSSContentContext, owner: JSSStyleNode): void => {
    let record = activatedContents.get(value)
    if (!record) {
      record = { rules: value.onActive?.(context) ?? [], nodes: [] }
      activatedContents.set(value, record)
    }
    const surviving = record.nodes.filter((node) => session.hasOutput(node))
    if (surviving.length) {
      surviving.forEach((node) => session.own(owner, node))
      return
    }
    for (const rule of record.rules) {
      const address = ruleAddress(rule, resourceIdentities)
      let pending = pendingRules.get(address)
      if (!pending) pendingRules.set(address, pending = { rule, owners: new Set(), records: new Set() })
      pending.rule = rule
      pending.owners.add(owner)
    }
  }
  /** 按需资源记录每一个消费者，改写撤销不影响其他消费者。 */
  const createDependencyNodes = (): JSSStyleNode[] => {
    const pending = [...pendingRules.entries()]
    pendingRules.clear()
    if (!pending.length) return []
    const finalRules = new Map<Rule, Set<ActivationRecord>>()
    for (const [, entry] of pending) {
      let records = finalRules.get(entry.rule)
      if (!records) finalRules.set(entry.rule, records = entry.records)
      else entry.records = records
    }
    // 生成时读取各记录的当前 Rules；一次收集精确身份关系，产物不再逐项反查。
    for (const record of activatedContents.values()) {
      for (const rule of record.rules) finalRules.get(rule)?.add(record)
    }
    return pending.flatMap(([address, entry]) => {
      const owners = [...entry.owners].filter((owner) => session.isAlive(owner))
      if (!owners.length) return []
      return rulesToStyleNodes([entry.rule]).map((node, index) => {
        node.resourceAddress = address
        node.identity = `dependency/${address}/${index}`
        for (const owner of owners) session.own(owner, node)
        for (const record of entry.records) record.nodes.push(node)
        return node
      })
    })
  }
  const states = new WeakMap<JSSStyleNode, StyleNodeCompileState>()
  /** 按当前节点输入使旧角色进度失效；访问前与波末共用同一重置规则。 */
  const invalidateNodeState = (node: JSSStyleNode): boolean => {
    const state = states.get(node)
    if (!state) return false
    const revisionChanged = state.version !== node.compileRevision
    const keyChanged = revisionChanged || state.keySnapshot !== node.key
    const contentChanged = revisionChanged || state.contentSnapshot !== node.content
    if (keyChanged) {
      state.keyProgress = new WeakMap<object, ContentVisitResult>()
      state.keyComplete = !hasJSSContentOnCompileMethod(node.key)
      state.keySnapshot = node.key
    }
    if (contentChanged) {
      state.contentProgress = new WeakMap<object, ContentVisitResult>()
      state.contentReplacements = new WeakMap<object, unknown>()
      state.contentComplete = false
      state.contentSnapshot = node.content
    }
    state.version = node.compileRevision
    if (keyChanged || contentChanged) delete node.deferredReason
    return keyChanged || contentChanged
  }
  const budget: CompileBudget = { operations: 0, maximumOperations: 100_000 }
  const aggregations = new Map<string, AggregationRecord>()
  const aggregationOf = new WeakMap<JSSStyleNode, AggregationRecord>()
  let compileWaveIndex = 0

  /** 队列稳定后重新核对同址输入；结果自己的产物可能带来下一项贡献。 */
  const aggregateReadyNodes = (): number => {
    const groups = new Map<string, { nodes: JSSStyleNode[]; positions: Map<JSSStyleNode, number> }>()
    for (const node of styleNodes) {
      const record = aggregationOf.get(node)
      if (node.key === undefined || (record && !record.inputs.has(node))) continue
      const address = JSON.stringify([conditionAddressKey(node.conditionPath), propertyName(node.key)])
      let group = groups.get(address)
      if (!group) groups.set(address, group = { nodes: [], positions: new Map() })
      group.positions.set(node, group.nodes.length)
      group.nodes.push(node)
    }

    let changed = 0
    for (const [address, record] of aggregations) {
      const group = groups.get(address)
      let previousPosition = -1
      let unchanged = true
      for (const [node, snapshot] of record.inputs) {
        const position = group?.positions.get(node)
        if (position === undefined || position <= previousPosition || node.key !== snapshot.key
          || (typeof node.key === 'string' ? undefined : node.key?.join) !== snapshot.join
          || node.content !== snapshot.content || node.compileRevision !== snapshot.revision) {
          unchanged = false
          break
        }
        previousPosition = position
      }
      const latest = record.results.at(-1)!
      if (unchanged && session.isAlive(latest)) {
        session.move(latest, group!.nodes.at(-1)!, 'after')
        continue
      }
      for (const result of [...record.results].reverse()) {
        session.remove(result)
        aggregationOf.delete(result)
      }
      for (const input of record.inputs.keys()) aggregationOf.delete(input)
      aggregations.delete(address)
      changed++
    }
    if (changed) return changed

    for (const [address, { nodes: group }] of groups) {
      if (group.length < 2) continue
      const joiners = new Set(group.flatMap((node) => typeof node.key === 'string' || !node.key?.join ? [] : [node.key.join]))
      assert(joiners.size <= 1, `同名 JSSKey 的组合规则冲突：${propertyName(group[0].key!)}。`)
      const join = [...joiners][0]
      const previous = aggregations.get(address)
      if (previous && previous.inputs.size === group.length) continue
      const values = group.map((node) => {
        const state = states.get(node)!
        const content = node.content
        const resolvedContents = state.contentReplacements
        let view: Value<ValueData>
        view = value(content as ValueData, {
          get dependencies() { return view.content === content ? [] : value(view.content).dependencies },
          toCSSString: (current, resolve) => value(current).toCSSString(current === content
            ? (item) => contentToCSSString(item, resolvedContents)
            : resolve),
        })
        return view
      })
      const anchor = group[group.length - 1]
      const content = join ? join(values) : value(values)
      const result = session.insert(anchor, session.insertionIdentity(anchor), anchor.conditionPath, anchor.key, content, anchor, 'after')
      const record = previous ?? { inputs: new Map<JSSStyleNode, AggregationInput>(), results: [] }
      record.inputs = new Map()
      for (const node of group) {
        session.own(node, result)
        record.inputs.set(node, {
          key: node.key,
          join: typeof node.key === 'string' ? undefined : node.key?.join,
          content: node.content,
          revision: node.compileRevision,
        })
        aggregationOf.set(node, record)
      }
      record.results.push(result)
      aggregationOf.set(result, record)
      aggregations.set(address, record)
      changed++
    }
    return changed
  }

  while (true) {
    const waveStyleNodes = styleNodes.slice()
    let hasWaitingContent = false
    const activeObjects = new Set<object>()

    // 本波只访问开始时已有的节点，改写后已删除的节点立即跳过。
    for (const node of waveStyleNodes) {
      if (!session.hasOutput(node)) continue
      delete node.deferredReason
      invalidateNodeState(node)
      const state = states.get(node) ?? {
        version: node.compileRevision,
        keyProgress: new WeakMap<object, ContentVisitResult>(),
        contentProgress: new WeakMap<object, ContentVisitResult>(),
        contentReplacements: new WeakMap<object, unknown>(),
        keySnapshot: node.key,
        contentSnapshot: node.content,
        keyComplete: !hasJSSContentOnCompileMethod(node.key),
        contentComplete: false,
      }
      states.set(node, state)

      const path: ConditionPath = node.conditionPath
      const activateHere = (content: JSSContent): void => activate(content, {
        root: sourceRules,
        conditionPath: {
          semanticPath: path.semanticPath?.slice(),
          targetConditionPath: [...path.targetConditionPath],
          stateConditionPath: [...path.stateConditionPath],
        },
        key: node.key,
      }, node)
      const contextFor = (role: JSSCompileContext['role']): JSSCompileContext => ({
        node,
        session: session.identity,
        conditionPath: {
          semanticPath: node.conditionPath.semanticPath?.slice(),
          targetConditionPath: [...node.conditionPath.targetConditionPath],
          stateConditionPath: [...node.conditionPath.stateConditionPath],
        },
        key: node.key,
        content: node.content,
        role,
        readState: role === 'declaration-content' ? node.readState : undefined,
      })
      if (!state.keyComplete) {
        const context = contextFor('declaration-key')
        const result = visitContent(node.key, context, controller, compileWaveIndex, state.keyProgress, undefined, activeObjects, budget, activateHere)
        state.keyComplete = result.complete && node.deferredReason === undefined
        state.keySnapshot = context.key
        if (node.deferredReason !== undefined) state.keyProgress = new WeakMap<object, ContentVisitResult>()
      }
      if (!session.hasOutput(node)) continue

      if (!state.contentComplete) {
        const context = contextFor('declaration-content')
        const result = visitContent(node.content, context, controller, compileWaveIndex, state.contentProgress, state.contentReplacements, activeObjects, budget, activateHere)
        if (result.complete && result.content !== context.content && isObjectLike(context.content)) {
          state.contentReplacements.set(context.content, result.content)
        }
        state.contentComplete = result.complete && node.deferredReason === undefined
        state.contentSnapshot = context.content
        if (node.deferredReason !== undefined) state.contentProgress = new WeakMap<object, ContentVisitResult>()
      }
      if (!state.keyComplete || !state.contentComplete || state.version !== node.compileRevision) hasWaitingContent = true
    }

    // 被消费内容产生的规则回到同一队列，从下一波开始编译。
    const dependencyStyleNodes = createDependencyNodes()
    const replacedResources = new Set(dependencyStyleNodes.flatMap((node) => node.resourceAddress === undefined ? [] : [node.resourceAddress]))
    if (replacedResources.size) {
      for (let index = styleNodes.length - 1; index >= 0; index--) {
        const address = styleNodes[index]?.resourceAddress
        if (address !== undefined && replacedResources.has(address)) session.remove(styleNodes[index])
      }
    }
    session.append(dependencyStyleNodes)
    let hasChangedNodes = false
    for (const node of styleNodes) {
      if (invalidateNodeState(node)) {
        hasWaitingContent = true
        hasChangedNodes = true
      }
    }
    const hasNewStyleNodes = dependencyStyleNodes.length > 0 || styleNodes.some((node) => !states.has(node))
    const deferred = styleNodes.find((node) => node.deferredReason !== undefined)
    if (!hasNewStyleNodes && deferred && !styleNodes.some((node) => {
      const state = states.get(node)
      return state && (state.version !== node.compileRevision || (node.deferredReason === undefined && (!state.keyComplete || !state.contentComplete)))
    })) throw deferred.deferredReason
    // 只有所有现存位置都完成，且没有新节点时，才交付输出队列。
    if (!hasWaitingContent && !hasNewStyleNodes) {
      if (aggregateReadyNodes()) {
        compileWaveIndex++
        assert(compileWaveIndex <= 10_000, 'AST 编译波超过上限 10000，Content 仍未完成。')
        continue
      }
      return styleNodes.flatMap((node) => {
        const aggregation = aggregationOf.get(node)
        if (aggregation && aggregation.results.at(-1) !== node) return []
        const state = states.get(node)
        if (!state || !state.keyComplete || !state.contentComplete) return []
        return [{
          conditionPath: outputConditionPath(node.conditionPath),
          key: node.key,
          content: node.content,
          resolvedContents: state.contentReplacements,
        }]
      })
    }
    assert(hasNewStyleNodes || hasChangedNodes || waveStyleNodes.some((node) => {
      const state = states.get(node)
      return session.hasOutput(node) && state && (!state.keyComplete || !state.contentComplete)
    }), 'AST 编译波没有进展，无法完成 Content。')
    compileWaveIndex++
    assert(compileWaveIndex <= 10_000, 'AST 编译波超过上限 10000，Content 仍未完成。')
  }
}
