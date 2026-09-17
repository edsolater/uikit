/** Condition 把 selector、状态或 At Rule 表达为 CSS 生效地址中的一层。 */

/**
 * 一层 CSS 生效地址：name 供 Rule 合并、Value 取值和 Variable Key 稳定匹配，header 是生成 CSS 时写在花括号前的文本。
 * name 相同即表示同一条件，因此 CSS 写法可以变化，已定义的 Value 状态名和局部覆盖仍能匹配。
 * @example
 * const hover = condition('&:hover', 'hover')
 * const enabledHover = condition('&:hover:not(:disabled)', 'hover')
 * // 两者都匹配 Value 中的 hover；生成 CSS 时分别使用各自 header。
 */
export interface Condition {
  /** 条件在地址、Value 状态与 Variable Key 中共用的稳定名称。 */
  name: string
  /** 生成 CSS 时作为 selector、At Rule 或其他块头的文本。 */
  header: string
}

/**
 * 从 CSS 根部逐层到达目标的有序条件地址；每一项在最终 CSS 中形成一层嵌套。
 * @example [condition('.Button'), condition('&:hover', 'hover')] // 表示 .Button 的 hover 位置。
 */
export type ConditionPath = Condition[]

/** 调用端可提供的条件地址：缺省表示当前位置，字符串使用相同的名称与 CSS 块头。 */
export type ConditionInput = Condition | string | (Condition | string)[] | undefined

/**
 * 创建一层 CSS 生效地址；第二参数是用于匹配的稳定名称，缺省时与 CSS 块头相同。
 * @example condition('&:where(:hover):not(:disabled)', 'hover') // 以 hover 匹配 Value，以第一参数生成 CSS。
 */
export function condition(header: string, name = header): Condition {
  return { name, header }
}

/**
 * 把便捷输入统一成有序地址：缺省值得到空地址，字符串转为同名同块头的 Condition。
 * @example toConditionPath(['.Button', condition('&:hover', 'hover')]) // 得到 Button 内的 hover 地址。
 */
export function toConditionPath(input: ConditionInput): ConditionPath {
  if (input === undefined) return []
  return (Array.isArray(input) ? input : [input]).map((item) => typeof item === 'string' ? condition(item) : item)
}

/** 用完整媒体查询构造一层 @media 条件，不校验查询语法。 */
export function media(query: string): Condition {
  return condition(`@media ${query}`)
}

/**
 * CSS 块头保留完整函数签名，条件名默认只使用函数名，使同名函数按整份定义替换。
 * @example
 * functionDefinition('--length-double(--length-input <length>) returns <length>')
 * // name 为 '@function --length-double'，header 保留全部参数及返回类型。
 */
export function functionDefinition(signature: string, name = signature.split('(')[0].trim()): Condition {
  return condition(`@function ${signature}`, `@function ${name}`)
}
