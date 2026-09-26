/** 将可改写的 JSS 样式节点逐波解析为只含可输出内容的节点。 */
import { outputConditionPath, type ConditionPath, type CSSConditionPath } from '../condition'
import { propertyName, type JSSKey } from '../key'
import type { Rule, Rules } from '../rule'
import { hasJSSContentParser, hasJSSContentOutput, type JSSContentContext, type JSSContent } from '../content'
import { rulesToStyleNodes, type JSSStyleNode } from './rules-to-style-nodes'

/** 一项已完成解析的声明；保留内容对象和子内容的解析结果供输出阶段读取。 */
export interface JSSContentNode {
  conditionPath: CSSConditionPath
  key: JSSKey | undefined
  content: unknown
  resolvedContents: WeakMap<object, unknown>
}

/** 当前解析位置的入口；查询和改写作用于本次编译的语义节点队列。 */
export interface ASTController {
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
  /** 为本次编译申请一次性标记；同一对象首次申请返回 true。 */
  claimOnce(value: object): boolean
  /** 按属性名和条件地址查找第一条节点；缺省地址是当前位置。 */
  findByKey(key: JSSKey, conditionPath?: ConditionPath): JSSStyleNode | undefined
  /** 相对当前节点插入内容，默认插在前面；新节点从下一波开始解析。 */
  insert(conditionPath: ConditionPath, key: JSSKey | undefined, content: unknown, position?: 'before' | 'after'): JSSStyleNode
  /** 删除当前节点；后续解析不再输出它。 */
  remove(): void
  /** 删除本次队列中同身份的旧资源节点。 */
  replaceResource(address: string): void
  /** 在当前节点前登记带替换身份的资源声明。 */
  insertResource(address: string, conditionPath: ConditionPath, key: JSSKey | undefined, content: unknown): JSSStyleNode
}

const maximumStyleNodeCount = 100_000

/** 用当前节点、解析波和编译会话动作建立控制器；返回的操作立即改写传入队列。 */
function createASTController(
  styleNodes: JSSStyleNode[],
  parseWaveIndex: number,
  conditionPath: ConditionPath,
  key: JSSKey | undefined,
  content: unknown,
  role: ASTController['role'],
  activate: (value: JSSContent) => void,
  claimOnce: (value: object) => boolean,
  currentNode: JSSStyleNode,
): ASTController {
  const currentPath = {
    targetConditionPath: [...conditionPath.targetConditionPath],
    stateConditionPath: [...conditionPath.stateConditionPath],
  }
  let beforeCurrentIndex = Math.max(0, styleNodes.indexOf(currentNode))
  let afterCurrentIndex = beforeCurrentIndex + 1

  /** 按调用顺序把新声明放在当前节点前或后。 */
  const insert = (path: ConditionPath, nodeKey: JSSKey | undefined, nodeContent: unknown, position: 'before' | 'after' = 'before'): JSSStyleNode => {
    if (styleNodes.length >= maximumStyleNodeCount) throw new Error(`AST 节点超过上限 ${maximumStyleNodeCount}，解析无法终止。`)
    const node: JSSStyleNode = {
      conditionPath: {
        targetConditionPath: [...path.targetConditionPath],
        stateConditionPath: [...path.stateConditionPath],
      },
      key: nodeKey,
      content: nodeContent,
    }
    if (position === 'after') {
      afterCurrentIndex = Math.max(afterCurrentIndex, styleNodes.indexOf(currentNode) + 1)
      styleNodes.splice(afterCurrentIndex++, 0, node)
    } else {
      beforeCurrentIndex = Math.min(beforeCurrentIndex, styleNodes.indexOf(currentNode))
      styleNodes.splice(beforeCurrentIndex++, 0, node)
      afterCurrentIndex++
    }
    return node
  }

  return {
    parseWaveIndex,
    conditionPath: currentPath,
    key,
    content,
    role,
    activate,
    claimOnce,
    findByKey(nodeKey, path = currentPath) {
      const wantedName = propertyName(nodeKey)
      const target = path.targetConditionPath.map((item) => item.header)
      const states = path.stateConditionPath.map((state) => state.name)
      return styleNodes.find((node) => node.key !== undefined && propertyName(node.key) === wantedName
        && JSON.stringify(node.conditionPath.targetConditionPath.map((item) => item.header)) === JSON.stringify(target)
        && JSON.stringify(node.conditionPath.stateConditionPath.map((state) => state.name)) === JSON.stringify(states))
    },
    insert,
    remove() {
      const currentIndex = styleNodes.indexOf(currentNode)
      if (currentIndex === -1) return
      styleNodes.splice(currentIndex, 1)
      if (beforeCurrentIndex > currentIndex) beforeCurrentIndex--
      if (afterCurrentIndex > currentIndex) afterCurrentIndex--
    },
    replaceResource(address) {
      for (let index = styleNodes.length - 1; index >= 0; index--) {
        if (styleNodes[index].resourceAddress === address) styleNodes.splice(index, 1)
      }
    },
    insertResource(address, path, nodeKey, nodeContent) {
      const node = insert(path, nodeKey, nodeContent)
      node.resourceAddress = address
      return node
    },
  }
}

/** 分别记录节点的 Key 与 Content 解析进度；任一内容被替换后重访对应位置。 */
interface StyleNodeParseState {
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

/** 区分可按身份追踪的对象与无需追踪的字面内容。 */
function isObjectReference(input: unknown): input is Record<PropertyKey, unknown> {
  return input !== null && (typeof input === 'object' || typeof input === 'function')
}

/** 在当前波访问 Key 或 Content 链，交回当前位置的内容及是否仍需后续波。 */
function visitContent(
  input: unknown,
  controller: ASTController,
  parsedObjects: WeakSet<object>,
  replacements: WeakMap<object, unknown> | undefined,
  activeObjects: Set<object>,
  budget: ParseBudget,
  depth = 0,
): ContentVisitResult {
  if (depth > 256) throw new Error('Content 解析嵌套超过上限 256，解析无法终止。')
  if (input === undefined || typeof input === 'string' || typeof input === 'number') return { content: input, complete: true }
  if (!isObjectReference(input)) throw new Error('无效的 CSS 内容。')
  if (activeObjects.has(input)) throw new Error('CSS 内容存在循环引用，无法生成 CSS。')
  activeObjects.add(input)
  try {
    if ('onActive' in input && typeof input.onActive === 'function') controller.activate(input as JSSContent)

    if (hasJSSContentParser(input)) {
      const earliestWave = input.parseWaveIndex ?? 0
      if (!Number.isInteger(earliestWave) || earliestWave < 0) throw new Error('parseWaveIndex 必须是非负整数。')
      if (!parsedObjects.has(input) && earliestWave > controller.parseWaveIndex) {
        visitChildren(input, controller, parsedObjects, replacements, activeObjects, budget, depth)
        return { content: input, complete: false }
      }
      if (!parsedObjects.has(input)) {
        budget.operations++
        if (budget.operations > budget.maximumOperations) throw new Error(`AST parse 操作超过上限 ${budget.maximumOperations}，解析无法终止。`)
        parsedObjects.add(input)
        const replacement = input.parse(controller)
        if (replacement !== input) {
          const result = visitContent(replacement, controller, parsedObjects, replacements, activeObjects, budget, depth + 1)
          if (result.complete) replacements?.set(input, result.content)
          return result
        }
      }
    }

    return visitChildren(input, controller, parsedObjects, replacements, activeObjects, budget, depth)
  } finally {
    activeObjects.delete(input)
  }
}

/** 沿对象的 contents 链访问子内容，汇总本波是否仍需继续解析。 */
function visitChildren(
  input: Record<PropertyKey, unknown>,
  controller: ASTController,
  parsedObjects: WeakSet<object>,
  replacements: WeakMap<object, unknown> | undefined,
  activeObjects: Set<object>,
  budget: ParseBudget,
  depth: number,
): ContentVisitResult {
  const contents = 'contents' in input && Array.isArray(input.contents) ? input.contents : undefined
  if (contents) {
    let complete = true
    for (const child of contents) {
      const result = visitContent(child, controller, parsedObjects, replacements, activeObjects, budget, depth + 1)
      if (result.content !== child && isObjectReference(child)) replacements?.set(child, result.content)
      complete &&= result.complete
    }
    return { content: input, complete }
  }

  if (hasJSSContentOutput(input)) return { content: input, complete: true }
  if (hasJSSContentParser(input)) return { content: input, complete: true }
  if ('onActive' in input && typeof input.onActive === 'function' && !contents) {
    return { content: undefined, complete: true }
  }
  throw new Error('无效的 CSS 内容。')
}

/** 按条件地址与 Key 标识同址资源，让后激活的 Rules 替换旧资源。 */
function ruleAddress(rule: Rule): string {
  const [conditionPath, key] = rule
  return JSON.stringify([
    conditionPath?.map((item) => typeof item === 'string' ? item : item.header),
    key === undefined ? undefined : propertyName(key),
  ])
}

/** 逐波解析可改写队列；按需 Rules 进入后续波，完成后返回有序内容节点。 */
export function styleNodesToContentNodes(styleNodes: JSSStyleNode[], sourceRules: Rules): JSSContentNode[] {
  const pendingRules = new Map<string, Rule>()
  const activatedContents = new Set<JSSContent>()
  /** 通知实际消费的内容，并收集它按需提供的 Rules。 */
  const activate = (value: JSSContent, context: JSSContentContext): void => {
    if (activatedContents.has(value)) return
    activatedContents.add(value)
    const rules = value.onActive?.(context)
    if (!rules) return
    for (const rule of rules) pendingRules.set(ruleAddress(rule), rule)
  }
  /** 将本波产生的 Rules 建成节点；同址资源身份保留到队列替换时。 */
  const createDependencyNodes = (): JSSStyleNode[] => {
    const pending = [...pendingRules.entries()]
    pendingRules.clear()
    return pending.flatMap(([address, rule]) => rulesToStyleNodes([rule]).map((node) => ({ ...node, resourceAddress: address })))
  }
  const states = new WeakMap<JSSStyleNode, StyleNodeParseState>()
  const claimedObjects = new Set<object>()
  const budget: ParseBudget = { operations: 0, maximumOperations: 100_000 }
  let parseWaveIndex = 0

  while (true) {
    const waveStyleNodes = styleNodes.slice()
    let hasWaitingContent = false
    const activeObjects = new Set<object>()

    // 本波只访问开始时已有的节点，改写后已删除的节点立即跳过。
    for (const node of waveStyleNodes) {
      if (!styleNodes.includes(node)) continue
      const state = states.get(node) ?? {
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
      if (!state.keyComplete) {
        const controller = createASTController(styleNodes, parseWaveIndex, path, node.key, node.content, 'declaration-key', (value) => {
          activate(value, { root: sourceRules, conditionPath: {
            targetConditionPath: [...path.targetConditionPath],
            stateConditionPath: [...path.stateConditionPath],
          }, key: node.key })
        }, (value) => {
          if (claimedObjects.has(value)) return false
          claimedObjects.add(value)
          return true
        }, node)
        const result = visitContent(node.key, controller, state.parsedKeyObjects, undefined, activeObjects, budget)
        state.keyComplete = result.complete
      }
      state.keySnapshot = node.key
      state.hasKeySnapshot = true
      if (!styleNodes.includes(node)) continue

      if (!state.contentComplete) {
        const controller = createASTController(styleNodes, parseWaveIndex, path, node.key, node.content, 'declaration-content', (value) => {
          activate(value, { root: sourceRules, conditionPath: {
            targetConditionPath: [...path.targetConditionPath],
            stateConditionPath: [...path.stateConditionPath],
          }, key: node.key })
        }, (value) => {
          if (claimedObjects.has(value)) return false
          claimedObjects.add(value)
          return true
        }, node)
        const result = visitContent(node.content, controller, state.parsedContentObjects, state.contentReplacements, activeObjects, budget)
        if (result.content !== node.content && isObjectReference(node.content)) {
          state.contentReplacements.set(node.content, result.content)
        }
        state.contentComplete = result.complete
      }
      state.contentSnapshot = node.content
      state.hasContentSnapshot = true
      if (!state.keyComplete || !state.contentComplete) hasWaitingContent = true
    }

    // 被消费内容产生的规则回到同一队列，从下一波开始解析。
    const dependencyStyleNodes = createDependencyNodes()
    const replacedResources = new Set(dependencyStyleNodes.flatMap((node) => node.resourceAddress === undefined ? [] : [node.resourceAddress]))
    if (replacedResources.size) {
      for (let index = styleNodes.length - 1; index >= 0; index--) {
        const address = styleNodes[index].resourceAddress
        if (address !== undefined && replacedResources.has(address)) styleNodes.splice(index, 1)
      }
    }
    styleNodes.push(...dependencyStyleNodes)
    for (const node of styleNodes) {
      const state = states.get(node)
      if (!state) continue
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
    if (!hasNewStyleNodes && !waveStyleNodes.some((node) => {
      const state = states.get(node)
      return styleNodes.includes(node) && state && (!state.keyComplete || !state.contentComplete)
    })) throw new Error('AST 解析波没有进展，无法完成 Content。')
    parseWaveIndex++
    if (parseWaveIndex > 10_000) throw new Error('AST 解析波超过上限 10000，Content 仍未完成。')
  }
}
