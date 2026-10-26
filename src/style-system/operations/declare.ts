/** CSS 声明的配对入口。
 *
 * 为属性或 Token 配对内容，并保留显式未定义基础的身份。
 *
 * 声明目标的 CSS 名称由坍缩边界负责。
 */
import { isArray, assert } from '@edsolater/fnkit'
import { isJSSKey, type JSSKey } from '../key'
import { isToken, type Token, type TokenInput } from '../token/core'
import { cssCustomProperty } from '../token/css'
import { declareCSSProperty } from '../token/declare'

/** 一条目标与内容配对，未定义内容不输出 CSS。 */
export type Declaration<C = TokenInput | undefined> = [
  key: Exclude<JSSKey, string>,
  content: C,
]

/**
 * 识别二元声明，不解析或输出目标的内容。
 */
export const isCSSPair = (input: unknown): input is [JSSKey, unknown] =>
  isArray(input) && input.length === 2 && isJSSKey(input[0])

/**
 * 声明 Token 的基础或替换值；普通属性直接配对指定内容。
 */
export function declare(target: Token, content?: TokenInput): Declaration
export function declare<C = TokenInput | undefined>(
  key: Exclude<JSSKey, string>,
  content: C,
): Declaration<C>
export function declare(
  key: Exclude<JSSKey, string>,
  ...contents: unknown[]
): Declaration<unknown> {
  assert(isJSSKey(key), 'declare 需要有效属性或 Token。')
  if (isToken(key)) {
    const target = cssCustomProperty(key)
    const declaration = declareCSSProperty(
      target,
      (contents.length ? contents[0] : target.content) as TokenInput,
    )
    return [key, declaration[1]]
  }
  return [key, contents[0]]
}
