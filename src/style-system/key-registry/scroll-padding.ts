/**
 * 滚动容器预留区的属性目标。
 *
 * 定义滚动容器内用于对齐的预留区域，保留物理/逻辑方向。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

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

/** 滚动容器预留区的 CSS 原名与具名 Key 对应表。 */
export const scrollPaddingKeys = {
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
}
