/**
 * CSS inline 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- alignment-baseline 属性族 ---

export const $alignmentBaseline = key('alignment-baseline')

// --- baseline-shift 属性族 ---

export const $baselineShift = key('baseline-shift')

// --- baseline-source 属性族 ---

export const $baselineSource = key('baseline-source')

// --- dominant-baseline 属性族 ---

export const $dominantBaseline = key('dominant-baseline')

// --- initial-letter 属性族 ---

export const $initialLetter = key('initial-letter')

// --- line 属性族 ---

export const $lineHeight = key('line-height')

// --- text 属性族 ---

export const $textBox = key('text-box')

export const $textBoxEdge = key('text-box-edge')

export const $textBoxTrim = key('text-box-trim')

// --- vertical-align 属性族 ---

export const $verticalAlign = key('vertical-align')

/** inline 模块的 CSS 原名与具名 Key 对应表。 */
export const inlineKeys = {
  'alignment-baseline': $alignmentBaseline,
  'baseline-shift': $baselineShift,
  'baseline-source': $baselineSource,
  'dominant-baseline': $dominantBaseline,
  'initial-letter': $initialLetter,
  'line-height': $lineHeight,
  'text-box': $textBox,
  'text-box-edge': $textBoxEdge,
  'text-box-trim': $textBoxTrim,
  'vertical-align': $verticalAlign,
}
