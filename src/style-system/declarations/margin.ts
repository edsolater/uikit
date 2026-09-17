/** 外边距在编译时按上、右、下、左展开。 */
import { declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import type { ValueInput } from '../core/css-value'

/** margin 简写声明的属性位置。 */
export const marginKey = key('margin')
/** margin-top 声明的属性位置。 */
export const marginTopKey = key('margin-top')
/** margin-right 声明的属性位置。 */
export const marginRightKey = key('margin-right')
/** margin-bottom 声明的属性位置。 */
export const marginBottomKey = key('margin-bottom')
/** margin-left 声明的属性位置。 */
export const marginLeftKey = key('margin-left')

/** 创建只设置顶部外边距的 Declaration，不补充其他方向。 */
export const marginTop = (input: ValueInput) => declaration(marginTopKey, input)

/** 创建只设置右侧外边距的 Declaration，不补充其他方向。 */
export const marginRight = (input: ValueInput) => declaration(marginRightKey, input)

/** 创建只设置底部外边距的 Declaration，不补充其他方向。 */
export const marginBottom = (input: ValueInput) => declaration(marginBottomKey, input)

/** 创建只设置左侧外边距的 Declaration，不补充其他方向。 */
export const marginLeft = (input: ValueInput) => declaration(marginLeftKey, input)

/** 创建 margin 简写 Declaration；值可静态拆分时由编译器扩写四个方向。 */
export const margin = (input: ValueInput) => declaration(marginKey, input)
