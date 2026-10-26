/**
 * 外部留白的属性目标。
 *
 * 定义盒子外的留白及其裁切规则；物理和逻辑方向同处。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

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

/** 外部留白的 CSS 原名与具名 Key 对应表。 */
export const marginKeys = {
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
}
