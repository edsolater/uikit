/**
 * 文字截断的属性目标。
 *
 * 控制文字溢出提示及行数截断，不接管通用盒子溢出。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $lineClamp = key('line-clamp')

export const $textOverflow = key('text-overflow')

/** 文字截断的 CSS 原名与具名 Key 对应表。 */
export const textOverflowKeys = {
  'line-clamp': $lineClamp,
  'text-overflow': $textOverflow,
}
