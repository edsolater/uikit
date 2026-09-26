/** 按解析波遍历 Key 与 Content 的通用能力并生成可输出节点。 */
import type { CompositeConditionPath } from '../condition'
import type { CSSKey } from '../css-key'
import { isASTParseable, isCSSOutputContent, type ASTParseable, type Valuable } from '../valuable'
import type { Rules } from '../rule'
import type { CompileContext } from '../valuable'
import type { ASTController } from './ast-controller'
import { createASTController } from './ast-controller'
import { outputConditionPath, type ParsedStyleNode, type StyleNode } from './style-nodes'

/** 每个声明位置独立保存对象完成状态和内容替换。 */
interface ContentPositionState {
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

/** 编译执行层为解析器提供的按需资源入口。 */
export interface RuleParserOptions {
  sourceRules: Rules
  activate(value: Valuable, context: CompileContext): void
  createDependencyNodes(): StyleNode[]
}

interface VisitResult {
  content: unknown
  complete: boolean
}

interface ParseBudget {
  operations: number
  maximumOperations: number
}

/** 判断 JavaScript 对象或函数内容。 */
function isObjectValue(input: unknown): input is Record<PropertyKey, unknown> {
  return input !== null && (typeof input === 'object' || typeof input === 'function')
}

/** 按内容自身的输出能力生成字符串，并读取已解析的子内容。 */
function serializeContent(input: unknown, replacements: WeakMap<object, unknown>, resolving = new Set<object>()): string | undefined {
  if (input === undefined) return undefined
  if (typeof input === 'string' || typeof input === 'number') return String(input)
  if (!isObjectValue(input)) throw new Error('无效的 CSS 内容。')
  if (replacements.has(input)) {
    const replacement = replacements.get(input)
    if (replacement !== input) return serializeContent(replacement, replacements, resolving)
  }
  if (resolving.has(input)) throw new Error('CSS 内容存在循环引用，无法生成 CSS。')
  resolving.add(input)
  try {
    if (!isCSSOutputContent(input)) throw new Error('CSS 内容仍未完成自身解析或输出。')
    return input.toCSSString((child) => {
      const replacement = isObjectValue(child) && replacements.has(child) ? replacements.get(child) : child
      return serializeContent(replacement, replacements, resolving)
    })
  } finally {
    resolving.delete(input)
  }
}

/** 让内容引用的对象在当前 Key 或 Content 位置完成解析。 */
function visitContent(
  input: unknown,
  controller: ASTController,
  parsedObjects: WeakSet<object>,
  replacements: WeakMap<object, unknown> | undefined,
  activeObjects: Set<object>,
  budget: ParseBudget,
  depth = 0,
): VisitResult {
  if (depth > 256) throw new Error('Content 解析嵌套超过上限 256，解析无法终止。')
  if (input === undefined || typeof input === 'string' || typeof input === 'number') return { content: input, complete: true }
  if (!isObjectValue(input)) throw new Error('无效的 CSS 内容。')
  if (activeObjects.has(input)) throw new Error('CSS 内容存在循环引用，无法生成 CSS。')
  activeObjects.add(input)
  try {
    if ('onActive' in input && typeof input.onActive === 'function') controller.activate(input as Valuable)

    if (isASTParseable(input)) {
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

/** 遍历内容公开的子内容链接；直接输出对象即为完成内容。 */
function visitChildren(
  input: Record<PropertyKey, unknown>,
  controller: ASTController,
  parsedObjects: WeakSet<object>,
  replacements: WeakMap<object, unknown> | undefined,
  activeObjects: Set<object>,
  budget: ParseBudget,
  depth: number,
): VisitResult {
  const contents = 'contents' in input && Array.isArray(input.contents) ? input.contents : undefined
  if (contents) {
    let complete = true
    for (const child of contents) {
      const result = visitContent(child, controller, parsedObjects, replacements, activeObjects, budget, depth + 1)
      if (result.content !== child && isObjectValue(child)) replacements?.set(child, result.content)
      complete &&= result.complete
    }
    return { content: input, complete }
  }

  if (isCSSOutputContent(input)) return { content: input, complete: true }
  if (isASTParseable(input)) return { content: input, complete: true }
  if ('onActive' in input && typeof input.onActive === 'function' && !contents) {
    return { content: undefined, complete: true }
  }
  throw new Error('无效的 CSS 内容。')
}

/** 用有限 ASTController 处理一条完整的 Rules 节点队列。 */
export function parseStyleNodes(nodes: StyleNode[], options: RuleParserOptions): ParsedStyleNode[] {
  const states = new WeakMap<StyleNode, ContentPositionState>()
  const claimedObjects = new Set<object>()
  const budget: ParseBudget = { operations: 0, maximumOperations: 100_000 }
  let parseWaveIndex = 0

  while (true) {
    const waveNodes = nodes.slice()
    let hasWaitingContent = false
    const activeObjects = new Set<object>()

    for (const node of waveNodes) {
      if (!nodes.includes(node)) continue
      const state = states.get(node) ?? {
        parsedKeyObjects: new WeakSet<object>(),
        parsedContentObjects: new WeakSet<object>(),
        contentReplacements: new WeakMap<object, unknown>(),
        keySnapshot: node.key,
        contentSnapshot: node.content,
        hasKeySnapshot: false,
        hasContentSnapshot: false,
        keyComplete: !isASTParseable(node.key),
        contentComplete: false,
      }
      states.set(node, state)

      if (state.hasKeySnapshot && state.keySnapshot !== node.key) {
        state.parsedKeyObjects = new WeakSet<object>()
        state.keyComplete = !isASTParseable(node.key)
      }
      if (state.hasContentSnapshot && state.contentSnapshot !== node.content) {
        state.parsedContentObjects = new WeakSet<object>()
        state.contentReplacements = new WeakMap<object, unknown>()
        state.contentComplete = false
      }

      const path: CompositeConditionPath = node.conditionPath
      if (!state.keyComplete) {
        const controller = createASTController(nodes, parseWaveIndex, path, node.key, node.content, 'declaration-key', (value) => {
          options.activate(value, { root: options.sourceRules, path: outputConditionPath(path), key: node.key })
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
      if (!nodes.includes(node)) continue

      if (!state.contentComplete) {
        const controller = createASTController(nodes, parseWaveIndex, path, node.key, node.content, 'declaration-content', (value) => {
          options.activate(value, { root: options.sourceRules, path: outputConditionPath(path), key: node.key })
        }, (value) => {
          if (claimedObjects.has(value)) return false
          claimedObjects.add(value)
          return true
        }, node)
        const result = visitContent(node.content, controller, state.parsedContentObjects, state.contentReplacements, activeObjects, budget)
        if (result.content !== node.content && isObjectValue(node.content)) {
          state.contentReplacements.set(node.content, result.content)
        }
        state.contentComplete = result.complete
      }
      state.contentSnapshot = node.content
      state.hasContentSnapshot = true
      if (!state.keyComplete || !state.contentComplete) hasWaitingContent = true
    }

    const dependencyNodes = options.createDependencyNodes()
    const replacedResources = new Set(dependencyNodes.flatMap((node) => node.resourceAddress === undefined ? [] : [node.resourceAddress]))
    if (replacedResources.size) {
      for (let index = nodes.length - 1; index >= 0; index--) {
        const address = nodes[index].resourceAddress
        if (address !== undefined && replacedResources.has(address)) nodes.splice(index, 1)
      }
    }
    nodes.push(...dependencyNodes)
    for (const node of nodes) {
      const state = states.get(node)
      if (!state) continue
      if (state.hasKeySnapshot && state.keySnapshot !== node.key) {
        state.parsedKeyObjects = new WeakSet<object>()
        state.keyComplete = !isASTParseable(node.key)
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
    const hasNewRootNodes = dependencyNodes.length > 0 || nodes.some((node) => !states.has(node))
    if (!hasWaitingContent && !hasNewRootNodes) {
      return nodes.flatMap((node) => {
        const state = states.get(node)
        if (!state || !state.keyComplete || !state.contentComplete) return []
        const value = serializeContent(node.content, state.contentReplacements)
        if (value === undefined) return []
        return [{ conditionPath: outputConditionPath(node.conditionPath), key: node.key === undefined ? undefined : keyName(node.key), value }]
      })
    }
    if (!hasNewRootNodes && !waveNodes.some((node) => {
      const state = states.get(node)
      return nodes.includes(node) && state && (!state.keyComplete || !state.contentComplete)
    })) throw new Error('AST 解析波没有进展，无法完成 Content。')
    parseWaveIndex++
    if (parseWaveIndex > 10_000) throw new Error('AST 解析波超过上限 10000，Content 仍未完成。')
  }
}

/** 取得直接 Key 或内容对象提供的属性名。 */
function keyName(key: CSSKey): string {
  return typeof key === 'string' ? key : key.toCSSString()
}
