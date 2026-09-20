/** 稳定的 CSS 内容与延迟输出协议。 */
import type { Valuable } from './css-valuable'
import type { Variable } from './css-variable'

export type { CompileContext } from './css-valuable'
export type ValueOptions = Valuable
export type RawValue = string | number

/** Value 只包装内容，不选择或传播状态。 */
export interface Value extends Valuable {
  kind: 'value'
  content: ValueInput
}
export type ValueReader = (input: ValueInput) => string | undefined
export type ValueReaderFunction = (read: ValueReader) => string | undefined
/** 已构造的内容可调用，也有明确的 CSS 输出入口。 */
export interface CSSFunction extends Valuable {
  (read: ValueReader): string | undefined
  serializeCSS: ValueReaderFunction
}
export type ValueInput = RawValue | Value | Variable | CSSFunction | undefined

/** 标记输出能力，避免与 source 回调混淆。 */
export function cssContent(serializeCSS: ValueReaderFunction): CSSFunction {
  return Object.assign(serializeCSS, { serializeCSS })
}
export function isCSSContent(input: unknown): input is CSSFunction {
  return typeof input === 'function' && 'serializeCSS' in input && typeof input.serializeCSS === 'function'
}
/** 包装稳定内容及其按需依赖。 */
export function value(content: ValueInput, options?: ValueOptions): Value {
  return { kind: 'value', content, ...options }
}
