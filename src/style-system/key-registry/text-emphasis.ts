/**
 * 文字强调标记的属性目标。
 *
 * 组织文字旁的强调标记及其颜色和位置。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $textEmphasis = key('text-emphasis')

export const $textEmphasisColor = key('text-emphasis-color')

export const $textEmphasisPosition = key('text-emphasis-position')

export const $textEmphasisStyle = key('text-emphasis-style')

/** 文字强调标记的 CSS 原名与具名 Key 对应表。 */
export const textEmphasisKeys = {
  'text-emphasis': $textEmphasis,
  'text-emphasis-color': $textEmphasisColor,
  'text-emphasis-position': $textEmphasisPosition,
  'text-emphasis-style': $textEmphasisStyle,
}
