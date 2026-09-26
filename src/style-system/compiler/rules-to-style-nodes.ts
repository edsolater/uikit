/** 将有序 Rules 展开为带条件地址的 JSS 样式节点队列。 */
import type { ConditionPath, TargetConditionPath } from '../condition'
import type { JSSKey } from '../key'
import type { Rules } from '../rule'
import { resolveStateConditions } from '../materials/state-conditions'
import { isJSSContent } from '../content'

/** 队列中一项可改写的样式内容；地址保留目标与状态，位置决定输出顺序。 */
export interface JSSStyleNode {
  conditionPath: ConditionPath
  key: JSSKey | undefined
  content: unknown
  /** 按需产生的资源用此身份替换同址旧资源；源规则不带此字段。 */
  resourceAddress?: string
}

/** 判断 Rule 声明的内容能否进入解析队列。 */
function isRuleContent(input: unknown): boolean {
  if (input === undefined || typeof input === 'string' || typeof input === 'number') return true
  return isJSSContent(input)
}

/** 将源 Rules 展开为有序节点；嵌套项继承外层地址与 Key，递归或无效内容时报错。 */
export function rulesToStyleNodes(sourceRules: Rules): JSSStyleNode[] {
  const styleNodes: JSSStyleNode[] = []
  const expandingRuleGroups = new Set<Rules>()

  /** 将 Rules 接到当前节点队列；嵌套项沿用上层地址与 Key。 */
  const appendStyleNodes = (rules: Rules, parentPath: TargetConditionPath = [], inheritedKey?: JSSKey, inheritedStateNames: string[] = []): void => {
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
          appendStyleNodes(ruleContent as Rules, targetConditionPath, key, stateNames)
          continue
        }
        if (!isRuleContent(ruleContent)) throw new Error('Rules 声明内容不是可解析的 CSS 内容。')
        styleNodes.push({
          conditionPath: { targetConditionPath, stateConditionPath: resolveStateConditions(stateNames) },
          key,
          content: ruleContent,
        })
      }
    } finally { expandingRuleGroups.delete(rules) }
  }

  appendStyleNodes(sourceRules)
  return styleNodes
}
