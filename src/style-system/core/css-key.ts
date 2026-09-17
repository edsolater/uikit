/** 将普通 CSS 属性、描述符和可重定义 Variable 统一为 Declaration 与 Rule 使用的 Key。 */
import type { Value } from './css-value'

/** Key 对应内容的组合方式；每种 CSS 属性只在定义 Key 时确定一次。 */
export type DeclarationSyntax = 'value' | 'border' | 'font' | 'padding' | 'margin' | 'transition' | 'box-shadow'

/** 一个具名 CSS 属性或描述符，同时保存其内容的编译语法。 */
export interface Key<K extends string = string> {
  name: K
  syntax: DeclarationSyntax
}

/** Variable 作为 Key 时必须仍是 variable 表达式，不能由其他具名 Value 冒充。 */
type VariableKey = Extract<Value, { kind: 'value' }> & {
  name: string
  expression: { type: 'variable'; name: string }
}

/** Declaration 可接收的 Key：属性名、具名 Key，或作为 Custom Property 的 Variable。 */
export type CSSKey = Key | string | VariableKey

/** 保存普通属性名或描述符名及其固定声明语法，不校验浏览器支持情况。 */
export function key<const K extends string>(name: K, syntax: DeclarationSyntax = 'value'): Key<K> {
  return { name, syntax }
}

/** 判断输入是否是字符串 Key、由 key() 创建的普通 Key，或 Variable。 */
export function isCSSKey(input: unknown): input is CSSKey {
  if (typeof input === 'string') return true
  if (input === null || typeof input !== 'object' || !('name' in input) || typeof input.name !== 'string') return false
  if ('kind' in input) {
    return input.kind === 'value' && 'expression' in input && input.expression !== null
      && typeof input.expression === 'object' && 'type' in input.expression && input.expression.type === 'variable'
  }
  return 'syntax' in input && ['value', 'border', 'font', 'padding', 'margin', 'transition', 'box-shadow'].includes(String(input.syntax))
}

/** 字符串和普通 Key 保留名称；Variable 统一补成一个 -- 前缀的 CSS 自定义属性名。 */
export function propertyName(key: CSSKey): string {
  if (typeof key === 'string') return key
  return 'kind' in key ? `--${key.name.replace(/^--/, '')}` : key.name
}

/** 普通 Key 使用自身语法；字符串和 Variable 都按完整值声明。 */
export function declarationSyntax(key: CSSKey): DeclarationSyntax {
  return typeof key === 'object' && 'syntax' in key ? key.syntax : 'value'
}
