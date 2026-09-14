/** 各方向及四边共用的外边距。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import { toValue, type Value } from '../core/css-value'

/** 上外边距 */
export const marginTopKey = key('margin-top')
export const marginTop = (input: Value | string): Declaration<'margin-top'> => declaration(marginTopKey, toValue(input))

/** 右外边距 */
export const marginRightKey = key('margin-right')
export const marginRight = (input: Value | string): Declaration<'margin-right'> =>
  declaration(marginRightKey, toValue(input))

/** 下外边距 */
export const marginBottomKey = key('margin-bottom')
export const marginBottom = (input: Value | string): Declaration<'margin-bottom'> =>
  declaration(marginBottomKey, toValue(input))

/** 左外边距 */
export const marginLeftKey = key('margin-left')
export const marginLeft = (input: Value | string): Declaration<'margin-left'> =>
  declaration(marginLeftKey, toValue(input))

/**
 * 四边共用同一值，按上、右、下、左排列。
 * @example
 * const button = styleRule('.button').attach(margin(value('8px')), marginLeft(value('12px')))
 */
export function margin(input: Value | string): Declaration[] {
  const value = toValue(input)
  return [marginTop(value), marginRight(value), marginBottom(value), marginLeft(value)]
}
