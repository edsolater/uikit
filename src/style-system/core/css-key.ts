/** Declaration 使用的 CSS Key。 */
import type { Value } from './css-value'

/** Key 的内容语法。 */
export type DeclarationSyntax = 'value' | 'border' | 'font' | 'padding' | 'margin' | 'transition' | 'box-shadow'

/** 具名 CSS Key。 */
export interface Key<K extends string = string> {
  name: K
  syntax: DeclarationSyntax
}

/** 可作为 Custom Property Key 的 Variable。 */
type VariableKey = Extract<Value, { kind: 'value' }> & {
  name: string
  expression: { type: 'variable'; name: string }
}

/** Declaration 接受的 Key。 */
export type CSSKey = Key | string | VariableKey

/** 创建具名 CSS Key。 */
export function key<const K extends string>(name: K, syntax: DeclarationSyntax = 'value'): Key<K> {
  return { name, syntax }
}

/** 判断输入是否是 CSS Key。 */
export function isCSSKey(input: unknown): input is CSSKey {
  if (typeof input === 'string') return true
  if (input === null || typeof input !== 'object' || !('name' in input) || typeof input.name !== 'string') return false
  if ('kind' in input) {
    return input.kind === 'value' && 'expression' in input && input.expression !== null
      && typeof input.expression === 'object' && 'type' in input.expression && input.expression.type === 'variable'
  }
  return 'syntax' in input && ['value', 'border', 'font', 'padding', 'margin', 'transition', 'box-shadow'].includes(String(input.syntax))
}

/** 取得 CSS 属性名。 */
export function propertyName(key: CSSKey): string {
  if (typeof key === 'string') return key
  return 'kind' in key ? `--${key.name.replace(/^--/, '')}` : key.name
}

/** 取得 Key 的内容语法。 */
export function declarationSyntax(key: CSSKey): DeclarationSyntax {
  return typeof key === 'object' && 'syntax' in key ? key.syntax : 'value'
}
