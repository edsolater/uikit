/** 从 CSSRoot 的 Rules 建立、解析并输出唯一的 CSS 编译链。 */
import type { ConditionPath, CompositeConditionPath } from '../condition'
import { propertyName, type CSSKey } from '../css-key'
import type { Rule, Rules, RuleValue } from '../rule'
import { resolveStateConditions } from '../materials/state-conditions'
import { isVariable, type Variable, type VariableOverrides } from '../variable'
import { clusterDeclarations } from '../variable-cluster'
import { isCSSOutputContent, type ParsedStyleNode, type StyleNode } from './style-nodes'
import { parseStyleNodes } from './rule-parser'
import { toCSSString } from './css-string'
import type { Valuable } from '../valuable'
import type { CompileContext } from '../valuable'

/** 识别经自身 parse 接入节点处理的内容对象。 */
function isParseableRuleValue(input: RuleValue): input is Exclude<RuleValue, Rules | VariableOverrides> {
  return input !== null && (typeof input === 'object' || typeof input === 'function')
    && 'parse' in input && typeof input.parse === 'function'
}

/** 从有序 Rules 展开普通声明及其条件地址。 */
export function buildStyleNodes(sourceRules: Rules): StyleNode[] {
  const nodes: StyleNode[] = []
  const expandingRuleGroups = new Set<Rules>()

  /** 沿嵌套规则展开，保留目标地址、状态与声明先后。 */
  const appendRules = (rules: Rules, parentPath: ConditionPath = [], inheritedKey?: CSSKey, inheritedStateNames: string[] = []): void => {
    if (expandingRuleGroups.has(rules)) throw new Error('Rules 内容存在递归引用，无法生成 CSS。')
    expandingRuleGroups.add(rules)
    try {
      for (const [relativePath, ruleKey, ruleContent] of rules) {
        const targetConditionPath = [...parentPath]
        const stateNames = [...inheritedStateNames]
        for (const pathCondition of relativePath ?? []) {
          if (typeof pathCondition === 'string') stateNames.push(pathCondition)
          else targetConditionPath.push(pathCondition)
        }
        const key = ruleKey ?? inheritedKey
        if (Array.isArray(ruleContent) && ruleContent.every((entry) => Array.isArray(entry) && entry.length === 3)) {
          appendRules(ruleContent as Rules, targetConditionPath, key, stateNames)
          continue
        }
        if (Array.isArray(ruleContent) && !isVariable(key)) throw new Error('嵌套 Rules 必须由路径、Key、内容三项组成。')
        const declarations: [CSSKey | undefined, RuleValue][] = clusterDeclarations(key, ruleContent) ?? [[key, ruleContent]]
        for (const [declarationKey, content] of declarations) {
          if (isParseableRuleValue(content) || content === undefined || typeof content === 'string' || typeof content === 'number'
            || isCSSOutputContent(content) || (typeof content === 'object' && content !== null && 'kind' in content)
            || (isVariable(declarationKey) && Array.isArray(content))
            || typeof content === 'function') {
            if (isVariable(declarationKey) && Array.isArray(content)) {
              for (const [name, value] of content as VariableOverrides) {
                const statePath = resolveStateConditions([...stateNames, ...(name === undefined ? [] : [name])])
                nodes.push({ conditionPath: { targetConditionPath: [...targetConditionPath], stateConditionPath: statePath }, key: declarationKey, content: value })
              }
            } else {
              nodes.push({
                conditionPath: { targetConditionPath: [...targetConditionPath], stateConditionPath: resolveStateConditions(stateNames) },
                key: declarationKey,
                content: content as StyleNode['content'],
              })
            }
            continue
          }
          throw new Error('Rules 声明内容不是可解析的 CSS 内容。')
        }
      }
    } finally { expandingRuleGroups.delete(rules) }
  }

  appendRules(sourceRules)
  return nodes
}

interface RuleCompilationState {
  sourceRules: Rules
  pendingDependencyRules: Map<string, Rule>
  activatedValues: Set<Valuable>
}

/** 依消费地址收集最后一份按需依赖规则。 */
function dependencyAddress(rule: Rule): string {
  const [conditionPath, key] = rule
  return JSON.stringify([
    conditionPath?.map((item) => typeof item === 'string' ? item : item.header),
    key === undefined ? undefined : propertyName(key),
  ])
}

/** 按可见状态顺序排列同一 Variable 的自动定义。 */
function orderVariableDefinitions(nodes: ParsedStyleNode[]): ParsedStyleNode[] {
  const byAddress = new Map<string, ParsedStyleNode[]>()
  for (const node of nodes) {
    if (!node.generatedVariableDefinition || !node.variableAddress) continue
    const group = byAddress.get(node.variableAddress) ?? []
    group.push(node)
    byAddress.set(node.variableAddress, group)
  }
  for (const group of byAddress.values()) group.sort((left, right) => {
    const leftOrders = left.variableStateOrders ?? []
    const rightOrders = right.variableStateOrders ?? []
    if (leftOrders.length !== rightOrders.length) return leftOrders.length - rightOrders.length
    for (let index = leftOrders.length - 1; index >= 0; index--) {
      const difference = leftOrders[index] - rightOrders[index]
      if (difference) return difference
    }
    return 0
  })
  const cursors = new Map<string, number>()
  return nodes.map((node) => {
    if (!node.generatedVariableDefinition || !node.variableAddress) return node
    const group = byAddress.get(node.variableAddress)!
    const cursor = cursors.get(node.variableAddress) ?? 0
    cursors.set(node.variableAddress, cursor + 1)
    return group[cursor]
  })
}

/** 解析本批 Rules 与按需依赖，并输出 CSS string。 */
export function compileRules(sourceRules: Rules): string {
  const state: RuleCompilationState = {
    sourceRules,
    pendingDependencyRules: new Map(),
    activatedValues: new Set(),
  }
  const nodes = buildStyleNodes(sourceRules)
  const parsedNodes = parseStyleNodes(nodes, {
    sourceRules,
    activate(value, context: CompileContext) {
      if (state.activatedValues.has(value)) return
      state.activatedValues.add(value)
      const dependencies = value.onActive?.(context)
      if (!dependencies) return
      for (const dependency of dependencies) state.pendingDependencyRules.set(dependencyAddress(dependency), dependency)
    },
    createDependencyNodes() {
      const pending = [...state.pendingDependencyRules.entries()]
      state.pendingDependencyRules.clear()
      return pending.flatMap(([address, dependency]) => buildStyleNodes([dependency]).map((node) => ({ ...node, dependencyAddress: address })))
    },
  })

  const mainNodes = parsedNodes.filter((node) => node.dependencyAddress === undefined)
  const dependencyNodesByAddress = new Map<string, ParsedStyleNode[]>()
  for (const node of parsedNodes) {
    if (node.dependencyAddress === undefined) continue
    const current = dependencyNodesByAddress.get(node.dependencyAddress) ?? []
    current.push(node)
    dependencyNodesByAddress.set(node.dependencyAddress, current)
  }
  const groups = [mainNodes, ...dependencyNodesByAddress.values()].map((group) => orderVariableDefinitions(group))
  const explicitNodes = groups.flatMap((group) => group.filter((node) => !node.generatedVariableDefinition))
  const variableDefinitions = groups.flatMap((group) => group.filter((node) => node.generatedVariableDefinition))
  const unshadowedDefinitions = variableDefinitions.filter((node) => !explicitNodes.some((explicit) =>
    explicit.key === node.key && JSON.stringify(explicit.conditionPath.map((item) => item.header))
      === JSON.stringify(node.conditionPath.map((item) => item.header))))
  return toCSSString(groups.flatMap((group) => [
    ...group.filter((node) => node.generatedVariableDefinition && unshadowedDefinitions.includes(node)),
    ...group.filter((node) => !node.generatedVariableDefinition),
  ]))
}
