/** 当前编译队列中的声明与最终可输出的内容声明。 */
import type { CompositeConditionPath, ConditionPath } from '../condition'
import type { CSSKey } from '../css-key'
import type { StateCondition } from '../materials/state-conditions'
import type { ValueInput } from '../value'

/** 待解析语义节点；节点在队列中的位置决定来源顺序。 */
export interface StyleNode {
  conditionPath: CompositeConditionPath
  key: CSSKey | undefined
  content: ValueInput | CSSOutputContent
  generatedVariableDefinition?: boolean
  variableAddress?: string
  variableStateOrders?: number[]
  dependencyAddress?: string
  resourceAddress?: string
}

/** 解析完成且能够交给 CSS 输出的内容。 */
export interface ParsedStyleNode {
  conditionPath: ConditionPath
  key: string | undefined
  value: string
  generatedVariableDefinition?: boolean
  variableAddress?: string
  variableStateOrders?: number[]
  dependencyAddress?: string
  resourceAddress?: string
}

/** CSS 可直接输出的值对象。 */
export interface CSSOutputContent {
  toCSSString(): string
}

/** 判断对象是否拥有直接 CSS 输出能力。 */
export function isCSSOutputContent(input: unknown): input is CSSOutputContent {
  return input !== null && typeof input === 'object'
    && 'toCSSString' in input && typeof input.toCSSString === 'function'
}

/** 把复合地址转换成 CSS 输出路径。 */
export function outputConditionPath(conditionPath: CompositeConditionPath): ConditionPath {
  return [...conditionPath.targetConditionPath, ...conditionPath.stateConditionPath.map((state: StateCondition) => state.condition)]
}
