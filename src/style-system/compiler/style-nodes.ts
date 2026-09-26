/** 当前编译队列中的声明与最终可输出的内容声明。 */
import type { CompositeConditionPath, ConditionPath } from '../condition'
import type { CSSKey } from '../css-key'
import type { StateCondition } from '../materials/state-conditions'

/** 待解析语义节点；节点在队列中的位置决定来源顺序。 */
export interface StyleNode {
  conditionPath: CompositeConditionPath
  key: CSSKey | undefined
  content: unknown
  resourceAddress?: string
}

/** 解析完成且能够交给 CSS 输出的内容。 */
export interface ParsedStyleNode {
  conditionPath: ConditionPath
  key: string | undefined
  value: string
}

/** 把复合地址转换成 CSS 输出路径。 */
export function outputConditionPath(conditionPath: CompositeConditionPath): ConditionPath {
  return [...conditionPath.targetConditionPath, ...conditionPath.stateConditionPath.map((state: StateCondition) => state.condition)]
}
