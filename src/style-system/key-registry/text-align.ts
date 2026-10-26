/**
 * 行内文字对齐的属性目标。
 *
 * 控制行内文字的对齐与两端对齐分配策略。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $textAlign = key('text-align')

export const $textAlignLast = key('text-align-last')

export const $textJustify = key('text-justify')

/** 行内文字对齐的 CSS 原名与具名 Key 对应表。 */
export const textAlignKeys = {
  'text-align': $textAlign,
  'text-align-last': $textAlignLast,
  'text-justify': $textJustify,
}
