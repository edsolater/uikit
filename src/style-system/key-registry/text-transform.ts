/**
 * 文字形态转换的属性目标。
 *
 * 控制大小写等显示形态转换，不修改原文本。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $textTransform = key('text-transform')

/** 文字形态转换的 CSS 原名与具名 Key 对应表。 */
export const textTransformKeys = {
  'text-transform': $textTransform,
}
