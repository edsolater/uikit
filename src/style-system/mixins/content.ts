/** 为主体内部的文字排版和内容排列提供可复用效果。 */
import type { Declarations } from '../core/css-rule'
import type { ValueInput } from '../core/css-value'
import { $font, $fontSize, $fontWeight, $lineHeight } from '../properties/font'
import { $display, $gap, $gridAutoFlow, $placeContent, $placeItems } from '../properties/layout'
import { $padding, type PaddingInput } from '../properties/padding'

/** 一次内容排版配置；只提供本层需要建立或覆盖的部分。 */
export interface InnerTextMixinOptions {
  font?: ValueInput
  fontSize?: ValueInput
  emphasis?: ValueInput
  leading?: ValueInput
}

/** 把调用方选择的文字语义翻译为内容排版声明；省略的配置不改变当前层。 */
export const innerText = (options: InnerTextMixinOptions): Declarations => [
  [$font, options.font],
  [$fontSize, options.fontSize],
  [$fontWeight, options.emphasis],
  [$lineHeight, options.leading],
]

/** 一次内容布局配置；mode 选择排列目的，空间字段只建立或覆盖当前层提供的部分。 */
export interface ContentLayoutMixinOptions {
  mode?: 'center'
  gap?: ValueInput
  padding?: PaddingInput
}

/** 按指定模式与空间材料排列当前主体的内部内容，不改变主体在父布局中的位置。 */
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
