/**
 * CSS box-model 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- margin 属性族 ---

export const $margin = key('margin')

export const $marginBlock = key('margin-block')

export const $marginBlockEnd = key('margin-block-end')

export const $marginBlockStart = key('margin-block-start')

export const $marginBottom = key('margin-bottom')

export const $marginInline = key('margin-inline')

export const $marginInlineEnd = key('margin-inline-end')

export const $marginInlineStart = key('margin-inline-start')

export const $marginLeft = key('margin-left')

export const $marginRight = key('margin-right')

export const $marginTop = key('margin-top')

export const $marginTrim = key('margin-trim')

// --- padding 属性族 ---

export const $padding = key('padding')

export const $paddingBlock = key('padding-block')

export const $paddingBlockEnd = key('padding-block-end')

export const $paddingBlockStart = key('padding-block-start')

export const $paddingBottom = key('padding-bottom')

export const $paddingInline = key('padding-inline')

export const $paddingInlineEnd = key('padding-inline-end')

export const $paddingInlineStart = key('padding-inline-start')

export const $paddingLeft = key('padding-left')

export const $paddingRight = key('padding-right')

export const $paddingTop = key('padding-top')

/** box-model 模块的 CSS 原名与具名 Key 对应表。 */
export const boxModelKeys = {
  'margin': $margin,
  'margin-block': $marginBlock,
  'margin-block-end': $marginBlockEnd,
  'margin-block-start': $marginBlockStart,
  'margin-bottom': $marginBottom,
  'margin-inline': $marginInline,
  'margin-inline-end': $marginInlineEnd,
  'margin-inline-start': $marginInlineStart,
  'margin-left': $marginLeft,
  'margin-right': $marginRight,
  'margin-top': $marginTop,
  'margin-trim': $marginTrim,
  'padding': $padding,
  'padding-block': $paddingBlock,
  'padding-block-end': $paddingBlockEnd,
  'padding-block-start': $paddingBlockStart,
  'padding-bottom': $paddingBottom,
  'padding-inline': $paddingInline,
  'padding-inline-end': $paddingInlineEnd,
  'padding-inline-start': $paddingInlineStart,
  'padding-left': $paddingLeft,
  'padding-right': $paddingRight,
  'padding-top': $paddingTop,
}
