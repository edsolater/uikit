/**
 * CSS text-decoration 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- text 属性族 ---

export const $textDecoration = key('text-decoration')

export const $textDecorationColor = key('text-decoration-color')

export const $textDecorationInset = key('text-decoration-inset')

export const $textDecorationLine = key('text-decoration-line')

export const $textDecorationSkip = key('text-decoration-skip')

export const $textDecorationSkipInk = key('text-decoration-skip-ink')

export const $textDecorationStyle = key('text-decoration-style')

export const $textDecorationThickness = key('text-decoration-thickness')

export const $textEmphasis = key('text-emphasis')

export const $textEmphasisColor = key('text-emphasis-color')

export const $textEmphasisPosition = key('text-emphasis-position')

export const $textEmphasisStyle = key('text-emphasis-style')

export const $textShadow = key('text-shadow')

export const $textUnderlineOffset = key('text-underline-offset')

export const $textUnderlinePosition = key('text-underline-position')

/** text-decoration 模块的 CSS 原名与具名 Key 对应表。 */
export const textDecorationKeys = {
  'text-decoration': $textDecoration,
  'text-decoration-color': $textDecorationColor,
  'text-decoration-inset': $textDecorationInset,
  'text-decoration-line': $textDecorationLine,
  'text-decoration-skip': $textDecorationSkip,
  'text-decoration-skip-ink': $textDecorationSkipInk,
  'text-decoration-style': $textDecorationStyle,
  'text-decoration-thickness': $textDecorationThickness,
  'text-emphasis': $textEmphasis,
  'text-emphasis-color': $textEmphasisColor,
  'text-emphasis-position': $textEmphasisPosition,
  'text-emphasis-style': $textEmphasisStyle,
  'text-shadow': $textShadow,
  'text-underline-offset': $textUnderlineOffset,
  'text-underline-position': $textUnderlinePosition,
}
