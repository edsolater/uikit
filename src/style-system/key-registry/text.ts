/**
 * CSS text 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- hanging-punctuation 属性族 ---

export const $hangingPunctuation = key('hanging-punctuation')

// --- hyphenate-character 属性族 ---

export const $hyphenateCharacter = key('hyphenate-character')

// --- hyphenate-limit-chars 属性族 ---

export const $hyphenateLimitChars = key('hyphenate-limit-chars')

// --- hyphens 属性族 ---

export const $hyphens = key('hyphens')

// --- letter-spacing 属性族 ---

export const $letterSpacing = key('letter-spacing')

// --- line 属性族 ---

export const $lineBreak = key('line-break')

// --- overflow 属性族 ---

export const $overflowWrap = key('overflow-wrap')

// --- tab-size 属性族 ---

export const $tabSize = key('tab-size')

// --- text 属性族 ---

export const $textAlign = key('text-align')

export const $textAlignLast = key('text-align-last')

export const $textAutospace = key('text-autospace')

export const $textFit = key('text-fit')

export const $textIndent = key('text-indent')

export const $textJustify = key('text-justify')

export const $textSpacingTrim = key('text-spacing-trim')

export const $textTransform = key('text-transform')

export const $textWrap = key('text-wrap')

export const $textWrapMode = key('text-wrap-mode')

export const $textWrapStyle = key('text-wrap-style')

// --- white-space 属性族 ---

export const $whiteSpace = key('white-space')

export const $whiteSpaceCollapse = key('white-space-collapse')

// --- word-break 属性族 ---

export const $wordBreak = key('word-break')

// --- word-spacing 属性族 ---

export const $wordSpacing = key('word-spacing')

/** text 模块的 CSS 原名与具名 Key 对应表。 */
export const textKeys = {
  'hanging-punctuation': $hangingPunctuation,
  'hyphenate-character': $hyphenateCharacter,
  'hyphenate-limit-chars': $hyphenateLimitChars,
  'hyphens': $hyphens,
  'letter-spacing': $letterSpacing,
  'line-break': $lineBreak,
  'overflow-wrap': $overflowWrap,
  'tab-size': $tabSize,
  'text-align': $textAlign,
  'text-align-last': $textAlignLast,
  'text-autospace': $textAutospace,
  'text-fit': $textFit,
  'text-indent': $textIndent,
  'text-justify': $textJustify,
  'text-spacing-trim': $textSpacingTrim,
  'text-transform': $textTransform,
  'text-wrap': $textWrap,
  'text-wrap-mode': $textWrapMode,
  'text-wrap-style': $textWrapStyle,
  'white-space': $whiteSpace,
  'white-space-collapse': $whiteSpaceCollapse,
  'word-break': $wordBreak,
  'word-spacing': $wordSpacing,
}
