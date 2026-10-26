/**
 * 内部留白的属性目标。
 *
 * 定义内容与盒子边界之间的留白；物理和逻辑方向同处。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

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

/** 内部留白的 CSS 原名与具名 Key 对应表。 */
export const paddingKeys = {
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
