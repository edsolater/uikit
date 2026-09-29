/** 创建 Condition，并表达目标、状态与 CSS 输出地址。 */
import type { StateCondition } from './pieces/state-conditions'

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
  /** 未经状态排序的输入父链，用于语义归属；输出仍使用下列规范化地址。 */
  semanticPath?: (Condition | string)[]
  targetConditionPath: TargetConditionPath
  stateConditionPath: StateConditionPath
}

/** 将目标地址与主体状态按 CSS 嵌套顺序合成输出地址。 */
export function outputConditionPath(conditionPath: ConditionPath): CSSConditionPath {
  return [...conditionPath.targetConditionPath, ...conditionPath.stateConditionPath.map((state) => state.condition)]
}

/** 同一目标与规范化主体状态的输出地址；原始语义父链不参与。 */
export function conditionAddressKey(path: ConditionPath): string {
  return JSON.stringify([
    path.targetConditionPath.map((item) => item.header),
    path.stateConditionPath.map((state) => state.name),
  ])
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

/** 返回可比较的语义路径片段；有原始语义地址时保留其输入顺序。 */
export function semanticPathParts(path: ConditionPath): string[] {
  return (path.semanticPath ?? [...path.targetConditionPath, ...path.stateConditionPath.map((state) => state.name)])
    .map((item) => typeof item === 'string' ? `state:${item}` : `condition:${item.header}`)
}
/** 判断前一路径是否覆盖后一路径的起始片段；同一路径也成立。 */
export function isSemanticPathPrefix(parent: ConditionPath, child: ConditionPath): boolean {
  const prefix = semanticPathParts(parent)
  const parts = semanticPathParts(child)
  return prefix.length <= parts.length && prefix.every((item, index) => item === parts[index])
}
