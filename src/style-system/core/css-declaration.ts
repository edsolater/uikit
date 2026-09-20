/** CSS Declaration 二元协议。 */
import { isCSSKey, type CSSKey } from './css-key'
import type { ValueInput } from './css-value'

/** 一条 `[Key, content]` 声明；undefined content 表示无效。 */
export type Declaration<C = ValueInput | undefined> = [key: Exclude<CSSKey, string>, content: C]

/** 判断输入是否是 Declaration。 */
export function isCSSPair(input: unknown): input is [CSSKey, unknown] {
  return Array.isArray(input) && input.length === 2 && isCSSKey(input[0])
}

/** 配对 Key 与 content；undefined content 由 `rules()` 跳过。 */
export function declare<C = ValueInput | undefined>(key: Exclude<CSSKey, string>, content: C): Declaration<C>
export function declare(key: Exclude<CSSKey, string>, content: unknown): Declaration<unknown> {
  return [key, content]
}
