/**
 * 文字间距的属性目标。
 *
 * 组织字间、词间、自动空隙及制表符间距。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $letterSpacing = key('letter-spacing')

export const $tabSize = key('tab-size')

export const $textAutospace = key('text-autospace')

export const $textSpacingTrim = key('text-spacing-trim')

export const $wordSpacing = key('word-spacing')

/** 文字间距的 CSS 原名与具名 Key 对应表。 */
export const textSpacingKeys = {
  'letter-spacing': $letterSpacing,
  'tab-size': $tabSize,
  'text-autospace': $textAutospace,
  'text-spacing-trim': $textSpacingTrim,
  'word-spacing': $wordSpacing,
}
