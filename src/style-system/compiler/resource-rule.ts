/** 为内部按需 Rule 保留已有条件路径；公开 Rules 仍只解释普通 CSS 条件。 */
import { outputConditionPath, type ConditionPath } from '../condition'
import type { JSSKey } from '../key'
import type { Rule, RuleValue } from '../rule'

const paths = new WeakMap<Rule, ConditionPath>()

/** 输出实际条件，同时保存资源提交所需的状态与语义身份。 */
export function resourceRule(path: ConditionPath, key: JSSKey, content: RuleValue): Rule {
  const snapshot: ConditionPath = {
    targetConditionPath: [...path.targetConditionPath],
    stateConditionPath: [...path.stateConditionPath],
    semanticPath: path.semanticPath?.slice(),
  }
  const rule: Rule = [outputConditionPath(snapshot), key, content]
  paths.set(rule, snapshot)
  return rule
}

/** 普通外部 Rule 不携带内部元数据。 */
export function resourceConditionPath(rule: Rule): ConditionPath | undefined {
  return paths.get(rule)
}
