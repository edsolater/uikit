/** 稳定的 CSS 内容与延迟输出协议。 */
import { type ASTParseable, type Valuable, type CSSOutputContent, type CSSContentReader, type CSSContentInput } from './valuable'

export type { CompileContext } from './valuable'
export type ValueOptions = Valuable
export type RawValue = string | number

/** Value 只包装内容，不选择或传播状态。 */
export interface Value extends Valuable, CSSOutputContent {
  kind: 'value'
  content: ValueInput
  contents: ValueInput[]
}
export type ValueReader = CSSContentReader
export type ValueReaderFunction = (read: ValueReader) => string | undefined
/** 已构造的内容可调用，也有明确的 CSS 输出入口。 */
export interface CSSFunction extends Valuable, CSSOutputContent {
  (read: ValueReader): string | undefined
  serializeCSS: ValueReaderFunction
  contents: ValueInput[]
}
export type ValueInput = RawValue | CSSContentInput | undefined

/** 标记输出能力，避免与 source 回调混淆。 */
export function cssContent(serializeCSS: ValueReaderFunction, contents: ValueInput[] = []): CSSFunction {
  return Object.assign(serializeCSS, {
    serializeCSS,
    contents,
    toCSSString: (read?: ValueReader) => serializeCSS(read ?? (() => undefined)),
  })
}
export function isCSSContent(input: unknown): input is CSSFunction {
  return typeof input === 'function' && 'serializeCSS' in input && typeof input.serializeCSS === 'function'
}
/** 包装稳定内容及其按需依赖。 */
export function value(content: ValueInput, options?: ValueOptions): Value {
  const result = {
    kind: 'value' as const,
    content,
    ...options,
    get contents(): ValueInput[] { return result.content === undefined ? [] : [result.content] },
    toCSSString(read?: ValueReader): string | undefined {
      return result.content === undefined ? undefined : read?.(result.content)
    },
  }
  return result
}
