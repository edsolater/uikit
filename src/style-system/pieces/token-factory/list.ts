/** 用 Token 装配逗号与空格分隔的内容。 */
import { arraySequenceToCSSString } from '../../content'
import { token, type TokenData } from '../../token/core'

/**
 * 逗号分隔内容；沿用 Token 的默认数组输出。
 */
export function valueList(...items: TokenData[]) {
  return token(items)
}

/**
 * 空格分隔内容。
 */
export function valueSequence(...items: TokenData[]) {
  return token(items, { toCSSString: arraySequenceToCSSString })
}
