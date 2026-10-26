/**
 * 断行与空白处理的属性目标。
 *
 * 组织换行、词/连字符断开与参与断行的空白处理。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $hyphenateCharacter = key('hyphenate-character')

export const $hyphenateLimitChars = key('hyphenate-limit-chars')

export const $hyphens = key('hyphens')

export const $lineBreak = key('line-break')

export const $overflowWrap = key('overflow-wrap')

export const $textWrap = key('text-wrap')

export const $textWrapMode = key('text-wrap-mode')

export const $textWrapStyle = key('text-wrap-style')

export const $whiteSpace = key('white-space')

export const $whiteSpaceCollapse = key('white-space-collapse')

export const $wordBreak = key('word-break')

/** 断行与空白处理的 CSS 原名与具名 Key 对应表。 */
export const textWrapKeys = {
  'hyphenate-character': $hyphenateCharacter,
  'hyphenate-limit-chars': $hyphenateLimitChars,
  'hyphens': $hyphens,
  'line-break': $lineBreak,
  'overflow-wrap': $overflowWrap,
  'text-wrap': $textWrap,
  'text-wrap-mode': $textWrapMode,
  'text-wrap-style': $textWrapStyle,
  'white-space': $whiteSpace,
  'white-space-collapse': $whiteSpaceCollapse,
  'word-break': $wordBreak,
}
