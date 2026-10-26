/** 创建 Condition，并表达目标、状态与 CSS 输出地址。 */
import type { StateCondition } from './pieces/state-conditions'
import { assert, isString } from '@edsolater/fnkit'

/** 一层 CSS 地址；header 同时是身份和输出块头。 */
export interface Condition {
  /** CSS 块头。 */
  header: string
}

/** 创建一层 CSS 地址。 */
export function condition(header: string): Condition {
  assert(isString(header), 'Condition 的 header 必须是字符串。')
  return { header }
}

/** 从根部逐层嵌套的目标地址。 */
export type TargetConditionPath = Condition[]

/** 状态条件并入后，供最终 CSS 使用的嵌套地址。 */
export type CSSConditionPath = Condition[]

/** 当前目标状态条件；不修改目标地址身份。 */
export type StateConditionPath = StateCondition[]

/** 样式节点的完整地址，由目标位置与主体状态组成。 */
export interface ConditionPath {
  targetConditionPath: TargetConditionPath
  stateConditionPath: StateConditionPath
}

/** 将目标地址与主体状态按 CSS 嵌套顺序合成输出地址。 */
export function outputConditionPath(
  conditionPath: ConditionPath,
): CSSConditionPath {
  return [
    ...conditionPath.targetConditionPath,
    ...conditionPath.stateConditionPath.map((state) => state.condition),
  ]
}

/** 同一目标与规范化主体状态的输出地址。 */
export function conditionAddressKey(path: ConditionPath): string {
  return JSON.stringify([
    path.targetConditionPath.map((item) => item.header),
    path.stateConditionPath.map((state) => state.name),
  ])
}

/** Condition 地址输入；缺省表示当前位置。 */
export type ConditionInput =
  Condition | string | (Condition | string)[] | undefined

/** 创建 `@media` Condition。 */
export function media(query: string): Condition {
  assert(isString(query), 'media 的查询必须是字符串。')
  return condition(`@media ${query}`)
}

/** 创建 CSS `@function` Condition。 */
export function functionDefinition(signature: string): Condition {
  assert(isString(signature), 'functionDefinition 的签名必须是字符串。')
  return condition(`@function ${signature}`)
}
