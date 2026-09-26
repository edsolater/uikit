/** CSS Declaration 二元协议。 */
import { isJSSKey, type JSSKey } from './key'
import type { ValueInput } from './value'

/** 一条 `[Key, content]` 声明；undefined content 表示无效。 */
export type Declaration<C = ValueInput | undefined> = [key: Exclude<JSSKey, string>, content: C]

/** 判断输入是否是 Declaration。 */
export function isCSSPair(input: unknown): input is [JSSKey, unknown] {
  return Array.isArray(input) && input.length === 2 && isJSSKey(input[0])
}

/** 配对 Key 与 content；undefined content 由 `rules()` 跳过。 */
export function declare<C = ValueInput | undefined>(key: Exclude<JSSKey, string>, content: C): Declaration<C>
export function declare(key: Exclude<JSSKey, string>, content: unknown): Declaration<unknown> {
  return [key, content]
}
