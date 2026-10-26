/**
 * 基线对齐的属性目标。
 *
 * 控制行内/SVG 内容采用哪条基线及其对齐和偏移。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $alignmentBaseline = key('alignment-baseline')

export const $baselineShift = key('baseline-shift')

export const $baselineSource = key('baseline-source')

export const $dominantBaseline = key('dominant-baseline')

export const $verticalAlign = key('vertical-align')

/** 基线对齐的 CSS 原名与具名 Key 对应表。 */
export const baselineKeys = {
  'alignment-baseline': $alignmentBaseline,
  'baseline-shift': $baselineShift,
  'baseline-source': $baselineSource,
  'dominant-baseline': $dominantBaseline,
  'vertical-align': $verticalAlign,
}
