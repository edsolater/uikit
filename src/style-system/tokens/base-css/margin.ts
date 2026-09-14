/** 各方向及四边共用的外边距。 */
import { declaration, type Declaration } from '../../core/css-declaration'
import { key } from '../../core/css-key'
import type { Value } from '../../core/css-value'

/** 上外边距 */
export const marginTopKey = key('margin-top')
export const marginTop = (value: Value): Declaration<'margin-top'> => declaration(marginTopKey, value)

/** 右外边距 */
export const marginRightKey = key('margin-right')
export const marginRight = (value: Value): Declaration<'margin-right'> => declaration(marginRightKey, value)

/** 下外边距 */
export const marginBottomKey = key('margin-bottom')
export const marginBottom = (value: Value): Declaration<'margin-bottom'> => declaration(marginBottomKey, value)

/** 左外边距 */
export const marginLeftKey = key('margin-left')
export const marginLeft = (value: Value): Declaration<'margin-left'> => declaration(marginLeftKey, value)

/**
 * 四边共用同一值，按上、右、下、左排列。
 * @example
 * const button = styleRule('.button', [...margin(value('8px')), marginLeft(value('12px'))])
 */
export function margin(value: Value): readonly Declaration[] {
  return [marginTop(value), marginRight(value), marginBottom(value), marginLeft(value)]
}
