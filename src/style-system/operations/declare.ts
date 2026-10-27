/**
 * CSS 声明的配对入口。
 *
 * 供规则归一和低层显式操作配对内容，保留显式未定义基础的身份。
 *
 * 声明目标的 CSS 名称由坍缩边界负责。
 */
import { isArray, assert, hasProperty } from '@edsolater/fnkit'
import { isJSSKey, resolveJSSKey, type JSSKey } from '../key'
import { isToken, type Token, type TokenInput } from '../token/core'
import { cssCustomProperty, cssPreparation } from '../token/css'
import { declareCSSProperty, isCSSDeclaration } from '../token/declare'

/** 一条目标与内容配对，未定义内容不输出 CSS。 */
export type Declaration<C = TokenInput | undefined> = [key: JSSKey, content: C]

/**
 * 识别二元声明，不解析或输出目标的内容。
 */
export const isCSSPair = (
  input: unknown,
): input is Readonly<Declaration<unknown>> =>
  isArray(input) && input.length === 2 && isJSSKey(input[0])

/**
 * 声明 Token 的基础或替换值；普通属性解析名称后配对，现成声明与修改保留语义。
 * Token 省略内容时采用自身基础；显式 undefined 保留无基础声明。
 *
 * @remarks
 * 手动调用属于 dangerous 操作，能力保留且不作额外拦截。
 * 普通属性直接交给 rules；Token 正常取值在 default、state、address 中定义。
 * 重声明 Token 可能改变其状态基础和其他引用，由调用方承担作用域及层叠后果。
 */
export function declare(target: Token, content?: TokenInput): Declaration
export function declare<C = TokenInput | undefined>(
  key: JSSKey,
  content: C,
): Declaration<C>
export function declare(
  key: JSSKey,
  ...contents: unknown[]
): Declaration<unknown> {
  assert(isJSSKey(key), 'declare 需要有效属性或 Token。')
  key = resolveJSSKey(key)
  if (isToken(key)) {
    const target = cssCustomProperty(key)
    const content = contents.length ? contents[0] : target.content
    if (
      (isCSSDeclaration(content) && content.variable === target) ||
      (hasProperty(content, 'kind', (kind) => kind === 'css-modification') &&
        cssPreparation(content))
    )
      return [key, content]
    const declaration = declareCSSProperty(target, content as TokenInput)
    return [key, declaration[1]]
  }
  return [key, contents[0]]
}
