/** 将可改写的 JSS 样式节点逐波编译为只含可输出内容的节点。 */
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
  compiledKeyObjects: WeakSet<object>
  compiledContentObjects: WeakSet<object>
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

/** 本次编译允许调用 onCompile 的总次数。 */
interface CompileBudget {
  operations: number
  maximumOperations: number
}

/** 在当前编译波访问 Key 或 Content 链，交回当前位置的内容及是否仍需后续波。 */
function visitContent(
  input: unknown,
  context: JSSCompileContext,
  controller: ASTController,
  compileWaveIndex: number,
  compiledObjects: WeakSet<object>,
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
      const earliestWave = input.compileWaveIndex ?? 0
      assert(Number.isInteger(earliestWave) && earliestWave >= 0, 'compileWaveIndex 必须是非负整数。')
      if (!compiledObjects.has(input) && earliestWave > compileWaveIndex) {
        visitChildren(input, context, controller, compileWaveIndex, compiledObjects, replacements, activeObjects, budget, activate, depth)
        return { content: input, complete: false }
      }
      if (!compiledObjects.has(input)) {
        budget.operations++
        assert(budget.operations <= budget.maximumOperations, `AST 编译操作超过上限 ${budget.maximumOperations}，编译无法终止。`)
        compiledObjects.add(input)
        const replacement = input.onCompile(context, controller)
        if (replacement !== input) {
          const result = visitContent(replacement, context, controller, compileWaveIndex, compiledObjects, replacements, activeObjects, budget, activate, depth + 1)
          if (result.complete) replacements?.set(input, result.content)
          return result
        }
      }
    }

    return visitChildren(input, context, controller, compileWaveIndex, compiledObjects, replacements, activeObjects, budget, activate, depth)
  } finally {
    activeObjects.delete(input)
  }
}

/** 沿对象的 dependencies 链访问子内容，汇总本波是否仍需继续编译。 */
function visitChildren(
  input: object,
  context: JSSCompileContext,
  controller: ASTController,
  compileWaveIndex: number,
  compiledObjects: WeakSet<object>,
  replacements: WeakMap<object, unknown> | undefined,
  activeObjects: Set<object>,
  budget: CompileBudget,
  activate: (content: JSSContent) => void,
  depth: number,
): ContentVisitResult {
  const dependencies = hasProperty(input, 'dependencies', isArray) ? input.dependencies : undefined
  if (dependencies) {
    let complete = true
    for (const child of dependencies) {
      const result = visitContent(child, context, controller, compileWaveIndex, compiledObjects, replacements, activeObjects, budget, activate, depth + 1)
      if (result.content !== child && isObjectLike(child)) replacements?.set(child, result.content)
      complete &&= result.complete
    }
    return { content: input, complete }
  }

  if (hasJSSContentOutput(input)) return { content: input, complete: true }
  if (hasJSSContentOnCompileMethod(input)) return { content: input, complete: true }
  if (hasProperty(input, 'onActive', isFunction) && !dependencies) {
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

/** 逐波编译可改写队列；按需 Rules 进入后续波，完成后返回有序内容节点。 */
export function styleNodesToContentNodes(styleNodes: JSSStyleNode[], sourceRules: Rules): JSSContentNode[] {
  const session = new ASTSession(styleNodes)
  const controller = createASTController(session)
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
  const states = new WeakMap<JSSStyleNode, StyleNodeCompileState>()
  const budget: CompileBudget = { operations: 0, maximumOperations: 100_000 }
  const aggregatedInputs = new Set<JSSStyleNode>()
  const aggregatedResults = new Set<JSSStyleNode>()
  const hiddenResults = new Set<JSSStyleNode>()
  const aggregations = new Map<string, {
    inputs: JSSStyleNode[]
    keys: (JSSKey | undefined)[]
    joiners: JSSKeyObject['join'][]
    contents: unknown[]
    versions: number[]
    results: JSSStyleNode[]
  }>()
  let compileWaveIndex = 0

  /** 队列稳定后重新核对同址输入；结果自己的产物可能带来下一项贡献。 */
  const aggregateReadyNodes = (): number => {
    const groups = new Map<string, JSSStyleNode[]>()
    for (const node of styleNodes) {
      if (node.key === undefined || aggregatedResults.has(node)) continue
      const address = JSON.stringify([conditionAddressKey(node.conditionPath), propertyName(node.key)])
      let group = groups.get(address)
      if (!group) groups.set(address, group = [])
      group.push(node)
    }

    let changed = 0
    for (const [address, record] of aggregations) {
      const group = groups.get(address) ?? []
      const positions = record.inputs.map((node) => group.indexOf(node))
      const keptOrder = positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1]))
      const sameKeys = record.inputs.every((node, index) => node.key === record.keys[index]
        && (typeof node.key === 'string' ? undefined : node.key?.join) === record.joiners[index])
      const sameContents = record.inputs.every((node, index) => node.content === record.contents[index] && node.compileRevision === record.versions[index])
      const latest = record.results[record.results.length - 1]
      if (keptOrder && sameKeys && sameContents && session.isAlive(latest)) {
        session.move(latest, group[group.length - 1], 'after')
        continue
      }
      for (const result of [...record.results].reverse()) {
        session.remove(result)
        aggregatedResults.delete(result)
        hiddenResults.delete(result)
      }
      for (const input of record.inputs) aggregatedInputs.delete(input)
      aggregations.delete(address)
      changed++
    }
    if (changed) return changed

    for (const [address, group] of groups) {
      if (group.length < 2) continue
      const joiners = new Set(group.flatMap((node) => typeof node.key === 'string' || !node.key?.join ? [] : [node.key.join]))
      assert(joiners.size <= 1, `同名 JSSKey 的组合规则冲突：${propertyName(group[0].key!)}。`)
      const join = [...joiners][0]
      const previous = aggregations.get(address)
      if (previous && previous.inputs.length === group.length) continue
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
      for (const node of group) {
        session.own(node, result)
        aggregatedInputs.add(node)
      }
      if (previous) hiddenResults.add(previous.results[previous.results.length - 1])
      aggregatedResults.add(result)
      aggregations.set(address, {
        inputs: group,
        keys: group.map((node) => node.key),
        joiners: group.map((node) => typeof node.key === 'string' ? undefined : node.key?.join),
        contents: group.map((node) => node.content),
        versions: group.map((node) => node.compileRevision),
        results: [...previous?.results ?? [], result],
      })
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
      if (!styleNodes.includes(node)) continue
      delete node.deferredReason
      if (states.get(node)?.version !== node.compileRevision) states.delete(node)
      const state = states.get(node) ?? {
        version: node.compileRevision,
        compiledKeyObjects: new WeakSet<object>(),
        compiledContentObjects: new WeakSet<object>(),
        contentReplacements: new WeakMap<object, unknown>(),
        keySnapshot: node.key,
        contentSnapshot: node.content,
        hasKeySnapshot: false,
        hasContentSnapshot: false,
        keyComplete: !hasJSSContentOnCompileMethod(node.key),
        contentComplete: false,
      }
      states.set(node, state)

      if (state.hasKeySnapshot && state.keySnapshot !== node.key) {
        state.compiledKeyObjects = new WeakSet<object>()
        state.keyComplete = !hasJSSContentOnCompileMethod(node.key)
      }
      if (state.hasContentSnapshot && state.contentSnapshot !== node.content) {
        state.compiledContentObjects = new WeakSet<object>()
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
        const result = visitContent(node.key, context, controller, compileWaveIndex, state.compiledKeyObjects, undefined, activeObjects, budget, activateHere)
        state.keyComplete = result.complete && node.deferredReason === undefined
        if (node.deferredReason !== undefined) state.compiledKeyObjects = new WeakSet<object>()
      }
      state.keySnapshot = node.key
      state.hasKeySnapshot = true
      if (!styleNodes.includes(node)) continue

      if (!state.contentComplete) {
        const context = contextFor('declaration-content')
        const result = visitContent(node.content, context, controller, compileWaveIndex, state.compiledContentObjects, state.contentReplacements, activeObjects, budget, activateHere)
        if (result.content !== node.content && isObjectLike(node.content)) {
          state.contentReplacements.set(node.content, result.content)
        }
        state.contentComplete = result.complete && node.deferredReason === undefined
        if (node.deferredReason !== undefined) state.compiledContentObjects = new WeakSet<object>()
      }
      state.contentSnapshot = node.content
      state.hasContentSnapshot = true
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
      const state = states.get(node)
      if (!state) continue
      if (state.version !== node.compileRevision) { state.contentComplete = false; hasWaitingContent = true; hasChangedNodes = true }
      if (state.hasKeySnapshot && state.keySnapshot !== node.key) {
        state.compiledKeyObjects = new WeakSet<object>()
        state.keyComplete = !hasJSSContentOnCompileMethod(node.key)
        state.keySnapshot = node.key
        hasWaitingContent = true
        hasChangedNodes = true
      }
      if (state.hasContentSnapshot && state.contentSnapshot !== node.content) {
        state.compiledContentObjects = new WeakSet<object>()
        state.contentReplacements = new WeakMap<object, unknown>()
        state.contentComplete = false
        state.contentSnapshot = node.content
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
        if (aggregatedInputs.has(node) || hiddenResults.has(node)) return []
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
      return styleNodes.includes(node) && state && (!state.keyComplete || !state.contentComplete)
    }), 'AST 编译波没有进展，无法完成 Content。')
    compileWaveIndex++
    assert(compileWaveIndex <= 10_000, 'AST 编译波超过上限 10000，Content 仍未完成。')
  }
}
