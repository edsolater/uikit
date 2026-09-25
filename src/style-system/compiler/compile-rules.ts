/** 从源规则建立可改写节点，完成求值后输出 CSS。 */
import type { ConditionPath } from '../condition'
import { propertyName, type CSSKey } from '../css-key'
import type { Rule, Rules, RuleValue, RewriteRuleContent } from '../rule'
import type { Valuable, CompileContext } from '../valuable'
import type { ValueInput } from '../value'
import { isVariable, type Variable, type VariableOverrides } from '../variable'
import { compileValue, type ValueContext } from './compile-value'
import { groupParsedNodesByAddress } from './group-parsed-nodes-by-address'
import { resolveStateConditions, type StateCondition } from '../materials/state-conditions'
import { clusterDeclarations } from '../variable-cluster'
import { isCSSOutputContent, type ContentStyleNode, type ParsedStyleNode, type RewriteStyleNode, type StyleNode } from './style-nodes'

/** 保存一批规则产生的普通声明和变量缺省声明。 */
interface ParsedNodeGroup {
  explicitNodes: ParsedStyleNode[]
  variableDefaults: { address: string; node: ParsedStyleNode; states: StateCondition[] }[]
  seenVariableScopes: Map<Variable, Set<string>>
}

/** 一次编译中的依赖发现、循环检查与完整定义替换。 */
interface RuleCompilationState {
  sourceRules: Rules
  pendingDependencyRules: Map<string, Rule>
  activatedValues: Set<Valuable>
  resolvingValues: Set<object>
}

/** 识别由内容对象提供改写方法的 Rule。 */
function isRewriteRuleContent(input: RuleValue): input is RewriteRuleContent {
  return input !== null && (typeof input === 'object' || typeof input === 'function')
    && 'rewriteStyleNodes' in input && typeof input.rewriteStyleNodes === 'function'
}

/** 将源规则与结构嵌套展开为保留普通地址、状态和原始内容的节点队列。 */
export function buildStyleNodes(sourceRules: Rules): StyleNode[] {
  const nodes: StyleNode[] = []
  const expandingRuleGroups = new Set<Rules>()

  /** 沿继承地址展开声明，保留每项内容原来的相对位置。 */
  const appendRules = (rules: Rules, parentPath: ConditionPath = [], inheritedKey?: CSSKey, inheritedStateNames: string[] = []): void => {
    if (expandingRuleGroups.has(rules)) throw new Error('Rules 内容存在递归引用，无法生成 CSS。')
    expandingRuleGroups.add(rules)
    try {
      for (const [relativePath, ruleKey, ruleContent] of rules) {
        const conditionPath = [...parentPath]
        const stateNames = [...inheritedStateNames]
        for (const condition of relativePath ?? []) {
          if (typeof condition === 'string') stateNames.push(condition)
          else conditionPath.push(condition)
        }
        const key = ruleKey ?? inheritedKey
        if (Array.isArray(ruleContent) && ruleContent.every((entry) => Array.isArray(entry) && entry.length === 3)) {
          appendRules(ruleContent as Rules, conditionPath, key, stateNames)
          continue
        }
        if (Array.isArray(ruleContent) && !isVariable(key)) throw new Error('嵌套 Rules 必须由路径、Key、内容三项组成。')
        const declarations: [CSSKey | undefined, RuleValue][] = clusterDeclarations(key, ruleContent) ?? [[key, ruleContent]]
        for (const [declarationKey, content] of declarations) {
          if (isRewriteRuleContent(content)) {
            nodes.push({
              kind: 'rewrite', conditionPath: [...conditionPath], stateConditionPath: resolveStateConditions(stateNames),
              key: declarationKey, value: content,
            })
            continue
          }
          if (isVariable(declarationKey) && Array.isArray(content)) {
            for (const [name, value] of content as VariableOverrides) {
              const branchStateNames = [...stateNames, ...(name === undefined ? [] : [name])]
              nodes.push({
                kind: 'content', conditionPath: [...conditionPath], stateConditionPath: resolveStateConditions(branchStateNames),
                key: declarationKey, value,
              })
            }
            continue
          }
          nodes.push({
            kind: 'content', conditionPath: [...conditionPath], stateConditionPath: resolveStateConditions(stateNames),
            key: declarationKey, value: content as ContentStyleNode['value'],
          })
        }
      }
    } finally { expandingRuleGroups.delete(rules) }
  }

  appendRules(sourceRules)
  return nodes
}

/** 按原特殊节点身份各改写一次；被前次改写移除的节点不再执行。 */
function applyStyleNodeRewrites(nodes: StyleNode[]): ContentStyleNode[] {
  const scheduled = nodes.filter((node): node is RewriteStyleNode => node.kind === 'rewrite')
  for (const node of scheduled) {
    const index = nodes.indexOf(node)
    if (index === -1) continue
    nodes.splice(index, 1)
    node.value.rewriteStyleNodes(nodes, index, node)
  }
  if (nodes.some((node) => node.kind === 'rewrite')) {
    throw new Error('Rule 改写结束后仍有特殊节点，无法生成 CSS。')
  }
  return nodes as ContentStyleNode[]
}

/** 激活被实际读取的内容；同址依赖只保留后一次完整定义。 */
function activateValueDependencies(value: Valuable, location: CompileContext, compilation: RuleCompilationState): void {
  if (compilation.activatedValues.has(value)) return
  compilation.activatedValues.add(value)
  const dependencyRules = value.onActive?.(location)
  if (!dependencyRules) return
  for (const dependencyRule of dependencyRules) {
    const [conditionPath, key] = dependencyRule
    const dependencyAddress = JSON.stringify([conditionPath, key === undefined ? undefined : propertyName(key)])
    compilation.pendingDependencyRules.set(dependencyAddress, dependencyRule)
  }
}

/** 改写节点后读取内容、收集变量缺省声明，并合并状态输出地址。 */
export function compileStyleNodes(nodes: StyleNode[], compilation: RuleCompilationState): ParsedNodeGroup {
  const parsed: ParsedNodeGroup = { explicitNodes: [], variableDefaults: [], seenVariableScopes: new Map() }
  for (const node of applyStyleNodeRewrites(nodes)) {
    const stateNames = node.stateConditionPath.map((state) => state.name)
    const valueContext: ValueContext = {
      root: compilation.sourceRules, path: node.conditionPath, key: node.key, resolving: compilation.resolvingValues,
      stateNames, scopeStateNames: stateNames,
      /** 只为仍在节点队列中的实际消费内容激活依赖。 */
      activate: (value, location = { root: compilation.sourceRules, path: node.conditionPath, key: node.key }) => activateValueDependencies(value, location, compilation),
      /** 补充 Variable 状态定义，显式同址声明在汇总时优先。 */
      defineVariable(reference, location, materialize) {
        const name = reference.name
        const variableAddress = JSON.stringify([location.path, name])
        const scopeStateNames = location.scopeStateNames ?? stateNames
        const scopeAddress = JSON.stringify([location.path, scopeStateNames])
        const seenScopes = parsed.seenVariableScopes.get(reference) ?? new Set<string>()
        if (seenScopes.has(scopeAddress)) return
        seenScopes.add(scopeAddress)
        parsed.seenVariableScopes.set(reference, seenScopes)
        for (const result of materialize({ ...location, stateNames: scopeStateNames })) {
          const stateConditions = resolveStateConditions(result.stateNames)
          const outputPath = [...location.path, ...stateConditions.map((state) => state.condition)]
          if (!parsed.variableDefaults.some(({ node: existing }) => existing.key === `--${name}`
            && JSON.stringify(existing.conditionPath.map((condition) => condition.header)) === JSON.stringify(outputPath.map((condition) => condition.header)))) {
            parsed.variableDefaults.push({ address: variableAddress, node: { conditionPath: outputPath, key: `--${name}`, value: result.text }, states: stateConditions })
          }
        }
      },
    }
    if (isVariable(node.key)) valueContext.activate(node.key)
    const nodeValues = isCSSOutputContent(node.value)
      ? [{ stateNames, value: node.value }]
      : compileValue(node.value as ValueInput, valueContext).map((result) => ({ stateNames: result.stateNames, value: result.text }))
    for (const result of nodeValues) {
      parsed.explicitNodes.push({
        conditionPath: [...node.conditionPath, ...resolveStateConditions(result.stateNames).map((state) => state.condition)],
        key: node.key === undefined ? undefined : propertyName(node.key), value: result.value,
      })
    }
  }
  return parsed
}

/** 变量缺省分支沿中央状态优先级排序，只交换同一地址的槽位。 */
function orderVariableDefaults(parsed: ParsedNodeGroup): ParsedStyleNode[] {
  const defaultsByVariableAddress = new Map<string, typeof parsed.variableDefaults>()
  for (const entry of parsed.variableDefaults) {
    const sameVariableDefaults = defaultsByVariableAddress.get(entry.address) ?? []
    sameVariableDefaults.push(entry)
    defaultsByVariableAddress.set(entry.address, sameVariableDefaults)
  }
  for (const sameVariableDefaults of defaultsByVariableAddress.values()) sameVariableDefaults.sort((left, right) => {
    if (left.states.length !== right.states.length) return left.states.length - right.states.length
    for (let index = left.states.length - 1; index >= 0; index--) {
      const difference = left.states[index].order - right.states[index].order
      if (difference) return difference
    }
    return 0
  })
  return parsed.variableDefaults.map(({ address }) => defaultsByVariableAddress.get(address)!.shift()!.node)
}

/** 只读取 parsed 内容的 CSS 输出能力，按地址开闭 CSS 块。 */
export function stringifyCSS(nodes: ParsedStyleNode[]): string {
  let openHeaders: string[] = []
  const lines: string[] = []
  for (const node of nodes) {
    const nextHeaders = node.conditionPath.map((condition) => condition.header).filter((header) => header !== undefined)
    let sharedDepth = 0
    while (sharedDepth < openHeaders.length && sharedDepth < nextHeaders.length && openHeaders[sharedDepth] === nextHeaders[sharedDepth]) sharedDepth++
    for (let index = openHeaders.length; index > sharedDepth; index--) lines.push('}')
    for (const header of nextHeaders.slice(sharedDepth)) lines.push(`${header} {`)
    const valueText = typeof node.value === 'string' ? node.value : node.value.toCSSString()
    lines.push(node.key === undefined ? valueText : `${node.key}: ${valueText};`)
    openHeaders = nextHeaders
  }
  for (let index = openHeaders.length; index > 0; index--) lines.push('}')
  return lines.join('\n')
}

/** 编译源规则及按需依赖；每批 Rules 都经过节点改写与 parsed 输出阶段。 */
export function compileRules(sourceRules: Rules): string {
  const compilation: RuleCompilationState = {
    sourceRules, pendingDependencyRules: new Map(), activatedValues: new Set(), resolvingValues: new Set(),
  }
  const parsedGroups = [compileStyleNodes(buildStyleNodes(sourceRules), compilation)]
  const dependencyGroupsByAddress = new Map<string, ParsedNodeGroup>()
  while (compilation.pendingDependencyRules.size) {
    const [address, dependencyRule] = compilation.pendingDependencyRules.entries().next().value!
    compilation.pendingDependencyRules.delete(address)
    dependencyGroupsByAddress.set(address, compileStyleNodes(buildStyleNodes([dependencyRule]), compilation))
  }
  parsedGroups.push(...dependencyGroupsByAddress.values())
  const nodeGroups = parsedGroups.map((parsed) => ({ explicitNodes: parsed.explicitNodes, variableDefaults: orderVariableDefaults(parsed) }))
  const explicitNodes = nodeGroups.flatMap((group) => group.explicitNodes)
  const variableDefaults = nodeGroups.flatMap((group) => group.variableDefaults)
  const unshadowedDefaults = variableDefaults.filter((node) => !explicitNodes.some((existing) =>
    existing.key === node.key && JSON.stringify(existing.conditionPath.map((item) => item.header))
      === JSON.stringify(node.conditionPath.map((item) => item.header))))
  const outputNodes = nodeGroups.flatMap((group) => groupParsedNodesByAddress([
    ...group.variableDefaults.filter((node) => unshadowedDefaults.includes(node)), ...group.explicitNodes,
  ]))
  return stringifyCSS(outputNodes)
}
