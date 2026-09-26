/** 创建 Condition，并表达目标、状态与 CSS 输出地址。 */
import type { StateCondition } from './materials/state-conditions'

/** 一层 CSS 地址；header 同时是身份和输出块头。 */
export interface Condition {
  /** CSS 块头。 */
  header: string
}

/** 从根部逐层嵌套的目标地址。 */
export type TargetConditionPath = Condition[]

/** 状态条件并入后，供最终 CSS 使用的嵌套地址。 */
export type CSSConditionPath = Condition[]

/** 当前目标状态条件；不修改目标地址身份。 */
export type StateConditionPath = StateCondition[]

/** 语义节点的完整地址，由目标位置与主体状态组成。 */
export interface ConditionPath {
  targetConditionPath: TargetConditionPath
  stateConditionPath: StateConditionPath
}

/** 将目标地址与主体状态按 CSS 嵌套顺序合成输出地址。 */
export function outputConditionPath(conditionPath: ConditionPath): CSSConditionPath {
  return [...conditionPath.targetConditionPath, ...conditionPath.stateConditionPath.map((state) => state.condition)]
}

/** Condition 地址输入；缺省表示当前位置。 */
export type ConditionInput = Condition | string | (Condition | string)[] | undefined

/** 创建一层 CSS 地址。 */
export function condition(header: string): Condition {
  return { header }
}

/** 创建 `@media` Condition。 */
export function media(query: string): Condition {
  return condition(`@media ${query}`)
}

/** 创建 CSS `@function` Condition。 */
export function functionDefinition(signature: string): Condition {
  return condition(`@function ${signature}`)
}
