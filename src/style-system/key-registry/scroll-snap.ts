/**
 * CSS scroll-snap 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- scroll 属性族 ---

export const $scrollInitialTarget = key('scroll-initial-target')

export const $scrollMargin = key('scroll-margin')

export const $scrollMarginBlock = key('scroll-margin-block')

export const $scrollMarginBlockEnd = key('scroll-margin-block-end')

export const $scrollMarginBlockStart = key('scroll-margin-block-start')

export const $scrollMarginBottom = key('scroll-margin-bottom')

export const $scrollMarginInline = key('scroll-margin-inline')

export const $scrollMarginInlineEnd = key('scroll-margin-inline-end')

export const $scrollMarginInlineStart = key('scroll-margin-inline-start')

export const $scrollMarginLeft = key('scroll-margin-left')

export const $scrollMarginRight = key('scroll-margin-right')

export const $scrollMarginTop = key('scroll-margin-top')

export const $scrollPadding = key('scroll-padding')

export const $scrollPaddingBlock = key('scroll-padding-block')

export const $scrollPaddingBlockEnd = key('scroll-padding-block-end')

export const $scrollPaddingBlockStart = key('scroll-padding-block-start')

export const $scrollPaddingBottom = key('scroll-padding-bottom')

export const $scrollPaddingInline = key('scroll-padding-inline')

export const $scrollPaddingInlineEnd = key('scroll-padding-inline-end')

export const $scrollPaddingInlineStart = key('scroll-padding-inline-start')

export const $scrollPaddingLeft = key('scroll-padding-left')

export const $scrollPaddingRight = key('scroll-padding-right')

export const $scrollPaddingTop = key('scroll-padding-top')

export const $scrollSnapAlign = key('scroll-snap-align')

export const $scrollSnapStop = key('scroll-snap-stop')

export const $scrollSnapType = key('scroll-snap-type')

/** scroll-snap 模块的 CSS 原名与具名 Key 对应表。 */
export const scrollSnapKeys = {
  'scroll-initial-target': $scrollInitialTarget,
  'scroll-margin': $scrollMargin,
  'scroll-margin-block': $scrollMarginBlock,
  'scroll-margin-block-end': $scrollMarginBlockEnd,
  'scroll-margin-block-start': $scrollMarginBlockStart,
  'scroll-margin-bottom': $scrollMarginBottom,
  'scroll-margin-inline': $scrollMarginInline,
  'scroll-margin-inline-end': $scrollMarginInlineEnd,
  'scroll-margin-inline-start': $scrollMarginInlineStart,
  'scroll-margin-left': $scrollMarginLeft,
  'scroll-margin-right': $scrollMarginRight,
  'scroll-margin-top': $scrollMarginTop,
  'scroll-padding': $scrollPadding,
  'scroll-padding-block': $scrollPaddingBlock,
  'scroll-padding-block-end': $scrollPaddingBlockEnd,
  'scroll-padding-block-start': $scrollPaddingBlockStart,
  'scroll-padding-bottom': $scrollPaddingBottom,
  'scroll-padding-inline': $scrollPaddingInline,
  'scroll-padding-inline-end': $scrollPaddingInlineEnd,
  'scroll-padding-inline-start': $scrollPaddingInlineStart,
  'scroll-padding-left': $scrollPaddingLeft,
  'scroll-padding-right': $scrollPaddingRight,
  'scroll-padding-top': $scrollPaddingTop,
  'scroll-snap-align': $scrollSnapAlign,
  'scroll-snap-stop': $scrollSnapStop,
  'scroll-snap-type': $scrollSnapType,
}
