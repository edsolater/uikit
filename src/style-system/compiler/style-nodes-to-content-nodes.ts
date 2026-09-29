/** 将可改写的 JSS 样式节点逐波解析为只含可输出内容的节点。 */
import { assert, hasProperty, isArray, isFunction, isObjectLike } from '@edsolater/fnkit'
import { outputConditionPath, type ConditionPath, type CSSConditionPath } from '../condition'
import { propertyName, type JSSKey } from '../key'
import type { Rule, Rules } from '../rule'
import { hasJSSContentParser, hasJSSContentOutput, type JSSContentContext, type JSSContent } from '../content'
import { rulesToStyleNodes, type JSSStyleNode } from './rules-to-style-nodes'
import { createASTController, ASTSession, type ASTController } from './ast-controller'

/** 一项已完成解析的声明；保留内容对象和子内容的解析结果供输出阶段读取。 */
export interface JSSContentNode {
  conditionPath: CSSConditionPath
  key: JSSKey | undefined
  content: unknown
  resolvedContents: WeakMap<object, unknown>
}


/** 分别记录节点的 Key 与 Content 解析进度；任一内容被替换后重访对应位置。 */
interface StyleNodeParseState {
  version: number
  parsedKeyObjects: WeakSet<object>
  parsedContentObjects: WeakSet<object>
  contentReplacements: WeakMap<object, unknown>
  keySnapshot: unknown
  contentSnapshot: unknown
  hasKeySnapshot: boolean
  hasContentSnapshot: boolean
  keyComplete: boolean
  contentComplete: boolean
}

/** 当前波访问一段内容的结果；未完成时保留它等待后续波。 */
interface ContentVisitResult {
  content: unknown
  complete: boolean
}

/** 本次解析允许调用 parse 的总次数。 */
interface ParseBudget {
  operations: number
  maximumOperations: number
}

/** 在当前波访问 Key 或 Content 链，交回当前位置的内容及是否仍需后续波。 */
function visitContent(
  input: unknown,
  controller: ASTController,
  parsedObjects: WeakSet<object>,
  replacements: WeakMap<object, unknown> | undefined,
  activeObjects: Set<object>,
  budget: ParseBudget,
  readState?: string,
  depth = 0,
): ContentVisitResult {
  assert(depth <= 256, 'Content 解析嵌套超过上限 256，解析无法终止。')
  if (input === undefined || typeof input === 'string' || typeof input === 'number') return { content: input, complete: true }
  assert(isObjectLike(input), '无效的 CSS 内容。')
  assert(!activeObjects.has(input), 'CSS 内容存在循环引用，无法生成 CSS。')
  activeObjects.add(input)
  try {
    if (hasProperty(input, 'onActive', isFunction)) controller.activate(input)

    if (hasJSSContentParser(input)) {
      const earliestWave = input.parseWaveIndex ?? 0
      assert(Number.isInteger(earliestWave) && earliestWave >= 0, 'parseWaveIndex 必须是非负整数。')
      if (!parsedObjects.has(input) && earliestWave > controller.parseWaveIndex) {
        visitChildren(input, controller, parsedObjects, replacements, activeObjects, budget, readState, depth)
        return { content: input, complete: false }
      }
      if (!parsedObjects.has(input)) {
        budget.operations++
        assert(budget.operations <= budget.maximumOperations, `AST parse 操作超过上限 ${budget.maximumOperations}，解析无法终止。`)
        parsedObjects.add(input)
        const replacement = input.parse(controller, readState)
        if (replacement !== input) {
          const result = visitContent(replacement, controller, parsedObjects, replacements, activeObjects, budget, readState, depth + 1)
          if (result.complete) replacements?.set(input, result.content)
          return result
        }
      }
    }

    return visitChildren(input, controller, parsedObjects, replacements, activeObjects, budget, readState, depth)
  } finally {
    activeObjects.delete(input)
  }
}

/** 沿对象的 contents 链访问子内容，汇总本波是否仍需继续解析。 */
function visitChildren(
  input: object,
  controller: ASTController,
  parsedObjects: WeakSet<object>,
  replacements: WeakMap<object, unknown> | undefined,
  activeObjects: Set<object>,
  budget: ParseBudget,
  readState: string | undefined,
  depth: number,
): ContentVisitResult {
  const contents = hasProperty(input, 'contents', isArray) ? input.contents : undefined
  if (contents) {
    let complete = true
    for (const child of contents) {
      const result = visitContent(child, controller, parsedObjects, replacements, activeObjects, budget, readState, depth + 1)
      if (result.content !== child && isObjectLike(child)) replacements?.set(child, result.content)
      complete &&= result.complete
    }
    return { content: input, complete }
  }

  if (hasJSSContentOutput(input)) return { content: input, complete: true }
  if (hasJSSContentParser(input)) return { content: input, complete: true }
  if (hasProperty(input, 'onActive', isFunction) && !contents) {
    return { content: undefined, complete: true }
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

/** 逐波解析可改写队列；按需 Rules 进入后续波，完成后返回有序内容节点。 */
export function styleNodesToContentNodes(styleNodes: JSSStyleNode[], sourceRules: Rules): JSSContentNode[] {
  const session = new ASTSession(styleNodes)
  const resourceIdentities = new Map<string | symbol, number>()
  const pendingRules = new Map<string, { rule: Rule; owners: Set<JSSStyleNode> }>()
  const activatedContents = new Map<JSSContent, { rules: Rules; nodes: JSSStyleNode[] }>()
  /** 通知实际消费的内容，并收集它按需提供的 Rules。 */
  const activate = (value: JSSContent, context: JSSContentContext, owner: JSSStyleNode): void => {
    let record = activatedContents.get(value)
    if (!record) {
      record = { rules: value.onActive?.(context) ?? [], nodes: [] }
      activatedContents.set(value, record)
    }
    const surviving = record.nodes.filter((node) => styleNodes.includes(node))
    if (surviving.length) {
      surviving.forEach((node) => session.own(owner, node))
      return
    }
    for (const rule of record.rules) {
      const address = ruleAddress(rule, resourceIdentities)
      let pending = pendingRules.get(address)
      if (!pending) pendingRules.set(address, pending = { rule, owners: new Set() })
      pending.rule = rule
      pending.owners.add(owner)
    }
  }
  /** 按需资源记录每一个消费者，改写撤销不影响其他消费者。 */
  const createDependencyNodes = (): JSSStyleNode[] => {
    const pending = [...pendingRules.entries()]
    pendingRules.clear()
    return pending.flatMap(([address, entry]) => {
      const owners = [...entry.owners].filter((owner) => session.isAlive(owner))
      if (!owners.length) return []
      return rulesToStyleNodes([entry.rule]).map((node, index) => {
      node.resourceAddress = address
      node.identity = `dependency/${address}/${index}`
      for (const owner of owners) session.own(owner, node)
      for (const record of activatedContents.values()) {
        if (record.rules.includes(entry.rule)) record.nodes.push(node)
      }
      return node
      })
    })
  }
  const states = new WeakMap<JSSStyleNode, StyleNodeParseState>()
  const budget: ParseBudget = { operations: 0, maximumOperations: 100_000 }
  let parseWaveIndex = 0

  while (true) {
    const waveStyleNodes = styleNodes.slice()
    let hasWaitingContent = false
    const activeObjects = new Set<object>()

    // 本波只访问开始时已有的节点，改写后已删除的节点立即跳过。
    for (const node of waveStyleNodes) {
      if (!styleNodes.includes(node)) continue
      session.deferred.delete(node)
      if (states.get(node)?.version !== session.version(node)) states.delete(node)
      const state = states.get(node) ?? {
        version: session.version(node),
        parsedKeyObjects: new WeakSet<object>(),
        parsedContentObjects: new WeakSet<object>(),
        contentReplacements: new WeakMap<object, unknown>(),
        keySnapshot: node.key,
        contentSnapshot: node.content,
        hasKeySnapshot: false,
        hasContentSnapshot: false,
        keyComplete: !hasJSSContentParser(node.key),
        contentComplete: false,
      }
      states.set(node, state)

      if (state.hasKeySnapshot && state.keySnapshot !== node.key) {
        state.parsedKeyObjects = new WeakSet<object>()
        state.keyComplete = !hasJSSContentParser(node.key)
      }
      if (state.hasContentSnapshot && state.contentSnapshot !== node.content) {
        state.parsedContentObjects = new WeakSet<object>()
        state.contentReplacements = new WeakMap<object, unknown>()
        state.contentComplete = false
      }

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
      if (!state.keyComplete) {
        const controller = createASTController(session, node, 'declaration-key', parseWaveIndex, activateHere)
        const result = visitContent(node.key, controller, state.parsedKeyObjects, undefined, activeObjects, budget)
        state.keyComplete = result.complete
      }
      state.keySnapshot = node.key
      state.hasKeySnapshot = true
      if (!styleNodes.includes(node)) continue

      if (!state.contentComplete) {
        const controller = createASTController(session, node, 'declaration-content', parseWaveIndex, activateHere)
        const result = visitContent(node.content, controller, state.parsedContentObjects, state.contentReplacements, activeObjects, budget, node.readState)
        if (result.content !== node.content && isObjectLike(node.content)) {
          state.contentReplacements.set(node.content, result.content)
        }
        state.contentComplete = result.complete && !session.deferred.has(node)
        if (session.deferred.has(node)) state.parsedContentObjects = new WeakSet<object>()
      }
      state.contentSnapshot = node.content
      state.hasContentSnapshot = true
      if (!state.keyComplete || !state.contentComplete || state.version !== session.version(node)) hasWaitingContent = true
    }

    // 被消费内容产生的规则回到同一队列，从下一波开始解析。
    const dependencyStyleNodes = createDependencyNodes()
    const replacedResources = new Set(dependencyStyleNodes.flatMap((node) => node.resourceAddress === undefined ? [] : [node.resourceAddress]))
    if (replacedResources.size) {
      for (let index = styleNodes.length - 1; index >= 0; index--) {
        const address = styleNodes[index]?.resourceAddress
        if (address !== undefined && replacedResources.has(address)) session.remove(styleNodes[index])
      }
    }
    session.append(dependencyStyleNodes)
    for (const node of styleNodes) {
      const state = states.get(node)
      if (!state) continue
      if (state.version !== session.version(node)) { state.contentComplete = false; hasWaitingContent = true }
      if (state.hasKeySnapshot && state.keySnapshot !== node.key) {
        state.parsedKeyObjects = new WeakSet<object>()
        state.keyComplete = !hasJSSContentParser(node.key)
        state.keySnapshot = node.key
        hasWaitingContent = true
      }
      if (state.hasContentSnapshot && state.contentSnapshot !== node.content) {
        state.parsedContentObjects = new WeakSet<object>()
        state.contentReplacements = new WeakMap<object, unknown>()
        state.contentComplete = false
        state.contentSnapshot = node.content
        hasWaitingContent = true
      }
    }
    const hasNewStyleNodes = dependencyStyleNodes.length > 0 || styleNodes.some((node) => !states.has(node))
    if (!hasNewStyleNodes && session.deferred.size && !styleNodes.some((node) => {
      const state = states.get(node)
      return state && (state.version !== session.version(node) || (!session.deferred.has(node) && (!state.keyComplete || !state.contentComplete)))
    })) throw session.deferred.values().next().value
    // 只有所有现存位置都完成，且没有新节点时，才交付输出队列。
    if (!hasWaitingContent && !hasNewStyleNodes) {
      return styleNodes.flatMap((node) => {
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
    assert(hasNewStyleNodes || waveStyleNodes.some((node) => {
      const state = states.get(node)
      return styleNodes.includes(node) && state && (!state.keyComplete || !state.contentComplete)
    }), 'AST 解析波没有进展，无法完成 Content。')
    parseWaveIndex++
    assert(parseWaveIndex <= 10_000, 'AST 解析波超过上限 10000，Content 仍未完成。')
  }
}
