/**
 * 数学排版的属性目标。
 *
 * 控制数学内容的样式、深度与偏移。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $mathDepth = key('math-depth')

export const $mathShift = key('math-shift')

export const $mathStyle = key('math-style')

/** 数学排版的 CSS 原名与具名 Key 对应表。 */
export const mathKeys = {
  'math-depth': $mathDepth,
  'math-shift': $mathShift,
  'math-style': $mathStyle,
}
