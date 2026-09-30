/** 内容排版 Mixin。 */
import type { Declarations } from '../../rule'
import type { ValueInput } from '../../value'
import { valueSequence } from '../contents/atom-creators/list'
import { $font, $fontSize, $fontWeight, $lineHeight } from '../keys/font'
import { $gap, $display, $alignItems, $justifyContent } from '../keys/layout'
import { $padding, $paddingTop, $paddingRight, $paddingBottom, $paddingLeft } from '../keys/padding'
import { fontValue, type FontParts } from '../contents/atom-creators/font'

/** 内部文字配置。 */
export interface InnerTextMixinOptions {
  font?: ValueInput | FontParts
  fontSize?: ValueInput
  emphasis?: ValueInput
  leading?: ValueInput
}

/** Mixin：内部文字。 */
export const innerText = (options: InnerTextMixinOptions = {}): Declarations => [
  [$font, options.font && typeof options.font === 'object' && 'family' in options.font ? fontValue(options.font) : options.font],
  [$fontSize, options.fontSize],
  [$fontWeight, options.emphasis],
  [$lineHeight, options.leading],
]

/** 内边距方向配置。 */
export interface PaddingSides {
  top?: ValueInput
  right?: ValueInput
  bottom?: ValueInput
  left?: ValueInput
}

/** 内边距：完整值、CSS 顺序位置值或指定方向。 */
export type PaddingInput = ValueInput | ValueInput[] | PaddingSides

/** 内容布局配置；center 负责选择实现并完成居中，省略 mode 不改变排列。 */
export interface ContentLayoutMixinOptions {
  mode?: 'center'
  gap?: ValueInput
  padding?: PaddingInput
}

/** Mixin：内容布局。 */
export const contentLayout = (options: ContentLayoutMixinOptions = {}): Declarations => [
  options.mode === 'center'
    ? [[$display, 'inline-flex'], [$alignItems, 'center'], [$justifyContent, 'center']]
    : undefined,
  [$gap, options.gap],
  paddingDeclarations(options.padding),
]

/** 内边距声明；未指定的方向不赋值。 */
function paddingDeclarations(input: PaddingInput): Declarations {
  if (Array.isArray(input)) return [[$padding, valueSequence(...input)]]
  if (input && typeof input === 'object' && !('kind' in input) && !('compile' in input) && !('toCSSString' in input)) {
    const sides = input as PaddingSides
    return [[$paddingTop, sides.top], [$paddingRight, sides.right], [$paddingBottom, sides.bottom], [$paddingLeft, sides.left]]
  }
  return [[$padding, input as ValueInput]]
}
