/** 在同一有序节点队列上运行 Root 波与 Content 次波。 */
import type { CompositeConditionPath } from '../condition'
import { propertyName, type CSSKey } from '../css-key'
import type { ASTParseable, CompileContext, Valuable } from '../valuable'
import { isCSSContent, type ValueInput } from '../value'
import { isVariable } from '../variable'
import { createASTController, type ASTController } from './ast-controller'
import { isCSSOutputContent, outputConditionPath, type CSSOutputContent, type ParsedStyleNode, type StyleNode } from './style-nodes'

/** 解析每个节点时需要隔离的完成状态。 */
interface ContentPositionState {
  parsedKeyObjects: WeakSet<object>
  parsedContentObjects: WeakSet<object>
  keyReplacements: WeakMap<object, ValueInput | CSSOutputContent>
  contentReplacements: WeakMap<object, ValueInput | CSSOutputContent>
  keySnapshot: CSSKey | undefined
  contentSnapshot: ValueInput | CSSOutputContent
  hasKeySnapshot: boolean
  hasContentSnapshot: boolean
  keyComplete: boolean
  contentComplete: boolean
}

/** 执行层提供依赖节点建立和已激活内容回调。 */
export interface RuleParserOptions {
  sourceRules: import('../rule').Rules
  activate(value: Valuable, context: CompileContext): void
  createDependencyNodes(): StyleNode[]
}

interface VisitResult {
  content: ValueInput | CSSOutputContent
  complete: boolean
}

interface ParseBudget {
  operations: number
  maximumOperations: number
}

/** 识别带有对象自身 parse 行为的内容。 */
function isASTParseable(input: unknown): input is ASTParseable {
  return input !== null && (typeof input === 'object' || typeof input === 'function')
    && 'parse' in input && typeof input.parse === 'function'
}

/** 识别对象值。 */
function isObjectValue(input: unknown): input is Record<PropertyKey, unknown> {
  return input !== null && (typeof input === 'object' || typeof input === 'function')
}

/** 直接序列化已解析的内容图；未解析对象不能绕过次波进入输出。 */
function serializeContent(
  input: unknown,
  replacements: WeakMap<object, ValueInput | CSSOutputContent>,
  resolving = new Set<object>(),
): string | undefined {
  if (input === undefined) return undefined
  if (typeof input === 'string' || typeof input === 'number') return String(input)
  if (!isObjectValue(input)) throw new Error('无效的 CSS 内容。')
  if (resolving.has(input)) throw new Error('Value 内容存在循环引用，无法生成 CSS。')
  resolving.add(input)
  try {
    if (isVariable(input)) throw new Error(`CSS 内容仍包含未解析 Variable --${input.name}。`)
    if (isASTParseable(input)) throw new Error('CSS 内容仍包含未解析对象。')
    if ('kind' in input && input.kind === 'value') {
      const content = isObjectValue(input.content) ? replacements.get(input.content) ?? input.content : input.content
      return serializeContent(content, replacements, resolving)
    }
    if (isCSSContent(input)) return input.serializeCSS((child) => {
      const replacement = isObjectValue(child) ? replacements.get(child) : undefined
      return serializeContent(replacement ?? child, replacements, resolving)
    })
    if (isCSSOutputContent(input)) return input.toCSSString()
    throw new Error('无效的 CSS 内容。')
  } finally {
    resolving.delete(input)
  }
}

/** 让内容引用的每个对象在当前声明位置完成解析。 */
function visitContent(
  input: ValueInput | CSSOutputContent,
  controller: ASTController,
  parsedObjects: WeakSet<object>,
  replacements: WeakMap<object, ValueInput | CSSOutputContent>,
  activeObjects: Set<object>,
  budget: ParseBudget,
  depth = 0,
): VisitResult {
  if (depth > 256) throw new Error('Content 解析嵌套超过上限 256，解析无法终止。')
  if (input === undefined || typeof input === 'string' || typeof input === 'number') return { content: input, complete: true }
  if (!isObjectValue(input)) throw new Error('无效的 CSS 内容。')
  if (activeObjects.has(input)) throw new Error('Value 内容存在循环引用，无法生成 CSS。')
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
          if (result.complete) {
            replacements.set(input, result.content)
          }
          return result
        }
      }
    }

    return visitChildren(input as Record<PropertyKey, unknown>, controller, parsedObjects, replacements, activeObjects, budget, depth)
  } finally {
    activeObjects.delete(input)
  }
}

/** 遍历 Value、CSS 函数及显式暴露 contents 的复合对象。 */
function visitChildren(
  input: Record<PropertyKey, unknown>,
  controller: ASTController,
  parsedObjects: WeakSet<object>,
  replacements: WeakMap<object, ValueInput | CSSOutputContent>,
  activeObjects: Set<object>,
  budget: ParseBudget,
  depth: number,
): VisitResult {
  if ('kind' in input && input.kind === 'value') {
    const previous = input.content as ValueInput
    const result = visitContent(previous, controller, parsedObjects, replacements, activeObjects, budget, depth + 1)
    if (result.content !== previous && isObjectValue(previous)) replacements.set(previous, result.content)
    return { content: input as unknown as ValueInput, complete: result.complete }
  }

  const contents = isCSSContent(input) ? input.contents : 'contents' in input && Array.isArray(input.contents) ? input.contents : undefined
  if (contents) {
    let complete = true
    for (let index = 0; index < contents.length; index++) {
      const previous = contents[index] as ValueInput
      const result = visitContent(previous, controller, parsedObjects, replacements, activeObjects, budget, depth + 1)
      if (result.content !== previous && isObjectValue(previous)) replacements.set(previous, result.content)
      complete &&= result.complete
    }
    return { content: input as unknown as ValueInput, complete }
  }

  if (isCSSOutputContent(input)) return { content: input as unknown as CSSOutputContent, complete: true }
  if (isASTParseable(input)) return { content: input as unknown as ValueInput, complete: true }
  if (isVariable(input)) throw new Error('Variable 未完成自身 parse。')
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
      const state = states.get(node) ?? {
        parsedKeyObjects: new WeakSet<object>(),
        parsedContentObjects: new WeakSet<object>(),
        keyReplacements: new WeakMap<object, ValueInput | CSSOutputContent>(),
        contentReplacements: new WeakMap<object, ValueInput | CSSOutputContent>(),
        keySnapshot: node.key,
        contentSnapshot: node.content,
        hasKeySnapshot: false,
        hasContentSnapshot: false,
        keyComplete: !isVariable(node.key),
        contentComplete: false,
      }
      states.set(node, state)
      if (state.hasKeySnapshot && state.keySnapshot !== node.key) {
        state.parsedKeyObjects = new WeakSet<object>()
        state.keyReplacements = new WeakMap<object, ValueInput | CSSOutputContent>()
        state.keyComplete = !isVariable(node.key)
      }
      if (state.hasContentSnapshot && state.contentSnapshot !== node.content) {
        state.parsedContentObjects = new WeakSet<object>()
        state.contentReplacements = new WeakMap<object, ValueInput | CSSOutputContent>()
        state.contentComplete = false
      }
      const path: CompositeConditionPath = node.conditionPath

      if (!state.keyComplete && isVariable(node.key)) {
        const controller = createASTController(nodes, parseWaveIndex, path, node.key, 'declaration-key', node.generatedVariableDefinition ?? false, (value) => {
          const location: CompileContext = { root: options.sourceRules, path: outputConditionPath(path), key: node.key }
          options.activate(value, location)
        }, (value) => {
          if (claimedObjects.has(value)) return false
          claimedObjects.add(value)
          return true
        }, node)
        const result = visitContent(node.key, controller, state.parsedKeyObjects, state.keyReplacements, activeObjects, budget)
        state.keyComplete = result.complete
      }
      state.keySnapshot = node.key
      state.hasKeySnapshot = true

      if (!state.contentComplete) {
        const controller = createASTController(nodes, parseWaveIndex, path, node.key, 'declaration-content', node.generatedVariableDefinition ?? false, (value) => {
          const location: CompileContext = { root: options.sourceRules, path: outputConditionPath(path), key: node.key }
          options.activate(value, location)
        }, (value) => {
          if (claimedObjects.has(value)) return false
          claimedObjects.add(value)
          return true
        }, node)
        const result = visitContent(node.content, controller, state.parsedContentObjects, state.contentReplacements, activeObjects, budget)
        node.content = result.content
        state.contentComplete = result.complete
      }
      state.contentSnapshot = node.content
      state.hasContentSnapshot = true

      if (!state.keyComplete || !state.contentComplete) {
        hasWaitingContent = true
        continue
      }

    }

    const dependencyNodes = options.createDependencyNodes()
    const replacedAddresses = new Set(dependencyNodes.flatMap((node) => node.dependencyAddress ? [node.dependencyAddress] : []))
    if (replacedAddresses.size) {
      for (let index = nodes.length - 1; index >= 0; index--) {
        if (nodes[index].dependencyAddress && replacedAddresses.has(nodes[index].dependencyAddress!)) nodes.splice(index, 1)
      }
    }
    nodes.push(...dependencyNodes)
    for (const node of nodes) {
      const state = states.get(node)
      if (!state) continue
      if (state.hasKeySnapshot && state.keySnapshot !== node.key) {
        state.parsedKeyObjects = new WeakSet<object>()
        state.keyReplacements = new WeakMap<object, ValueInput | CSSOutputContent>()
        state.keyComplete = !isVariable(node.key)
        state.keySnapshot = node.key
        hasWaitingContent = true
      }
      if (state.hasContentSnapshot && state.contentSnapshot !== node.content) {
        state.parsedContentObjects = new WeakSet<object>()
        state.contentReplacements = new WeakMap<object, ValueInput | CSSOutputContent>()
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
        return [{
          conditionPath: outputConditionPath(node.conditionPath),
          key: node.key === undefined ? undefined : propertyName(node.key),
          value,
          generatedVariableDefinition: node.generatedVariableDefinition,
          variableAddress: node.variableAddress,
          variableStateOrders: node.variableStateOrders,
          dependencyAddress: node.dependencyAddress,
          resourceAddress: node.resourceAddress,
        }]
      })
    }
    if (!hasNewRootNodes && !waveNodes.some((node) => {
      const state = states.get(node)
      return state && (!state.keyComplete || !state.contentComplete)
    })) throw new Error('AST 解析波没有进展，无法完成 Content。')
    parseWaveIndex++
    if (parseWaveIndex > 10_000) throw new Error('AST 解析波超过上限 10000，Content 仍未完成。')
  }
}
