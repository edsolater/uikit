/**
 * 滚动目标外扩区的属性目标。
 *
 * 定义目标参与滚动对齐时的外扩区域，保留物理/逻辑方向。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

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

/** 滚动目标外扩区的 CSS 原名与具名 Key 对应表。 */
export const scrollMarginKeys = {
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
}
