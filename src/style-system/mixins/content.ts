/** 内容排版 Mixin。 */
import type { Declarations } from '../core/css-rule'
import type { ValueInput } from '../core/css-value'
import { $font, $fontSize, $fontWeight, $lineHeight } from '../properties/font'
import { $display, $gap, $gridAutoFlow, $placeContent, $placeItems } from '../properties/layout'
import { $padding, type PaddingInput } from '../properties/padding'

/** 内部文字配置。 */
export interface InnerTextMixinOptions {
  font?: ValueInput
  fontSize?: ValueInput
  emphasis?: ValueInput
  leading?: ValueInput
}

/** Mixin：内部文字。 */
export const innerText = (options: InnerTextMixinOptions = {}): Declarations => [
  [$font, options.font],
  [$fontSize, options.fontSize],
  [$fontWeight, options.emphasis],
  [$lineHeight, options.leading],
]

/** 内容布局配置。 */
export interface ContentLayoutMixinOptions {
  mode?: 'center'
  gap?: ValueInput
  padding?: PaddingInput
}

/** Mixin：内容布局。 */
export const contentLayout = (options: ContentLayoutMixinOptions = {}): Declarations => [
  options.mode === 'center'
    ? [
        [$display, 'inline-grid'],
        [$gridAutoFlow, 'column'],
        [$placeContent, 'center'],
        [$placeItems, 'center'],
      ]
    : undefined,
  [$gap, options.gap],
  [$padding, options.padding],
]
