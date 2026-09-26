/** 从 CSSRoot 的 Rules 建立、解析并按完成顺序输出 CSS。 */
import type { ConditionPath } from '../condition'
import { propertyName, type CSSKey } from '../css-key'
import type { Rule, Rules, RuleValue } from '../rule'
import { resolveStateConditions } from '../materials/state-conditions'
import { isASTParseable, isCSSOutputContent, type Valuable } from '../valuable'
import type { ParsedStyleNode, StyleNode } from './style-nodes'
import { parseStyleNodes } from './rule-parser'
import { toCSSString } from './css-string'

/** 识别对象公开的 CSS 内容能力。 */
function isCSSRuleContent(input: unknown): boolean {
  if (input === undefined || typeof input === 'string' || typeof input === 'number') return true
  if (input === null || (typeof input !== 'object' && typeof input !== 'function')) return false
  return isCSSOutputContent(input) || isASTParseable(input)
    || ('contents' in input && Array.isArray(input.contents))
    || ('onActive' in input && typeof input.onActive === 'function')
}

/** 展开有序 Rules，按声明路径建立初始节点。 */
export function buildStyleNodes(sourceRules: Rules): StyleNode[] {
  const nodes: StyleNode[] = []
  const expandingRuleGroups = new Set<Rules>()

  /** 沿嵌套规则展开并保留目标地址、状态与声明先后。 */
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
        if (Array.isArray(ruleContent)) {
          if (!ruleContent.every((entry) => Array.isArray(entry) && entry.length === 3)) {
            throw new Error('嵌套 Rules 必须由路径、Key、内容三项组成。')
          }
          appendRules(ruleContent as Rules, targetConditionPath, key, stateNames)
          continue
        }
        if (!isCSSRuleContent(ruleContent)) throw new Error('Rules 声明内容不是可解析的 CSS 内容。')
        nodes.push({
          conditionPath: { targetConditionPath, stateConditionPath: resolveStateConditions(stateNames) },
          key,
          content: ruleContent,
        })
      }
    } finally { expandingRuleGroups.delete(rules) }
  }

  appendRules(sourceRules)
  return nodes
}

interface RuleCompilationState {
  sourceRules: Rules
  pendingRules: Map<string, Rule>
  activatedContents: Set<Valuable>
}

/** 取得同一条件地址及 Key 的按需规则替换地址。 */
function ruleAddress(rule: Rule): string {
  const [conditionPath, key] = rule
  return JSON.stringify([
    conditionPath?.map((item) => typeof item === 'string' ? item : item.header),
    key === undefined ? undefined : propertyName(key),
  ])
}

/** 编译 Rules，按需规则进入同一语义队列，顺序在解析时确定。 */
export function compileRules(sourceRules: Rules): string {
  const state: RuleCompilationState = {
    sourceRules,
    pendingRules: new Map(),
    activatedContents: new Set(),
  }
  const nodes = buildStyleNodes(sourceRules)
  const parsedNodes = parseStyleNodes(nodes, {
    sourceRules,
    activate(value, context) {
      if (state.activatedContents.has(value)) return
      state.activatedContents.add(value)
      const rules = value.onActive?.(context)
      if (!rules) return
      for (const rule of rules) state.pendingRules.set(ruleAddress(rule), rule)
    },
    createDependencyNodes() {
      const pending = [...state.pendingRules.entries()]
      state.pendingRules.clear()
      const dependencies = pending.flatMap(([address, rule]) => buildStyleNodes([rule]).map((node) => ({ ...node, resourceAddress: address })))
      return dependencies
    },
  })
  return toCSSString(parsedNodes)
}
