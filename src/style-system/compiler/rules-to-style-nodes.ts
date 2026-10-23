/** 将有序 Rules 展开为带条件地址的 JSS 样式节点队列。 */
import { assert, isFunction, isArray, isNumber, isString } from '@edsolater/fnkit'
import { condition, type ConditionPath, type TargetConditionPath } from '../condition'
import type { JSSKey } from '../key'
import type { Rules } from '../rule'
import { isJSSContent } from '../content'
import type { JSSStyleNode } from './contracts'

/** 将源 Rules 展开为有序节点；嵌套项继承外层地址与 Key，递归或无效内容时报错。 */
export function rulesToStyleNodes(sourceRules: Rules): JSSStyleNode[] {
  const styleNodes: JSSStyleNode[] = []
  const expandingRuleGroups = new Set<Rules>()

  /** 将 Rules 接到当前节点队列；嵌套项沿用上层地址与 Key。 */
  const appendStyleNodes = (rules: Rules, parentPath: TargetConditionPath = [], inheritedKey?: JSSKey): void => {
    assert(!expandingRuleGroups.has(rules), 'Rules 内容存在递归引用，无法生成 CSS。')
    expandingRuleGroups.add(rules)
    try {
      for (const [relativePath, ruleKey, ruleContent] of rules) {
        const targetConditionPath = [...parentPath, ...(relativePath ?? []).map((item) => isString(item) ? condition(item) : item)]
        assert(targetConditionPath.every(item => isString(item.header)), 'CSS Condition 的 header 必须是字符串。')
        const key = ruleKey ?? inheritedKey
        if (isArray(ruleContent)) {
          assert(
            ruleContent.every((entry) => isArray(entry) && entry.length === 3),
            '嵌套 Rules 必须由路径、Key、内容三项组成。',
          )
          appendStyleNodes(ruleContent as Rules, targetConditionPath, key)
          continue
        }
        assert(ruleContent === undefined || isString(ruleContent) || isNumber(ruleContent) || isJSSContent(ruleContent) || isFunction(ruleContent), 'Rules 声明内容不是可编译的 CSS 内容。')
        styleNodes.push({
          compileRevision: 0,
          conditionPath: { targetConditionPath, stateConditionPath: [] },
          key,
          content: ruleContent,
        })
      }
    } finally { expandingRuleGroups.delete(rules) }
  }

  appendStyleNodes(sourceRules)
  return styleNodes
}
