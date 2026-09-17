/** Condition 与有序生效地址。 */

/** 一层 CSS 地址；header 同时是身份和输出块头。 */
export interface Condition {
  /** CSS 块头。 */
  header: string
}

/** 从根部逐层嵌套的 Condition 地址。 */
export type ConditionPath = Condition[]

/** 未选择分支为 undefined，default 分支为空路径。 */
export type ConditionBranch = ConditionPath | undefined

/** Condition 地址身份。 */
export function conditionPathKey(path: ConditionPath): string {
  return JSON.stringify(path.map((item) => item.header))
}

/** 合并同址 Value 分支；不同分支返回 null。 */
export function mergeConditionBranch(current: ConditionBranch, next: ConditionPath): ConditionPath | null {
  return current === undefined || conditionPathKey(current) === conditionPathKey(next) ? next : null
}

/** Condition 地址输入；缺省表示当前位置。 */
export type ConditionInput = Condition | string | (Condition | string)[] | undefined

/** 创建一层 CSS 地址。 */
export function condition(header: string): Condition {
  return { header }
}

/** 把便捷输入归一为 Condition Path。 */
export function toConditionPath(input: ConditionInput): ConditionPath {
  if (input === undefined) return []
  return (Array.isArray(input) ? input : [input]).map((item) => typeof item === 'string' ? condition(item) : item)
}

/** 创建 `@media` Condition。 */
export function media(query: string): Condition {
  return condition(`@media ${query}`)
}

/** 创建 CSS `@function` Condition。 */
export function functionDefinition(signature: string): Condition {
  return condition(`@function ${signature}`)
}
