/**
 * 行框尺寸的属性目标。
 *
 * 定义行高以及文字盒上下缘和修剪，回答一行文字占据怎样的垂直空间。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $lineHeight = key('line-height')

export const $textBox = key('text-box')

export const $textBoxEdge = key('text-box-edge')

export const $textBoxTrim = key('text-box-trim')

/** 行框尺寸的 CSS 原名与具名 Key 对应表。 */
export const lineBoxKeys = {
  'line-height': $lineHeight,
  'text-box': $textBox,
  'text-box-edge': $textBoxEdge,
  'text-box-trim': $textBoxTrim,
}
