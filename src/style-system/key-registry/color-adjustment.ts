/**
 * 颜色呈现策略的属性目标。
 *
 * 控制配色环境、强制色、打印色及动态范围下的颜色呈现；不定义实际前景/背景颜色。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $colorScheme = key('color-scheme')

export const $dynamicRangeLimit = key('dynamic-range-limit')

export const $forcedColorAdjust = key('forced-color-adjust')

export const $printColorAdjust = key('print-color-adjust')

/** 颜色呈现策略的 CSS 原名与具名 Key 对应表。 */
export const colorAdjustmentKeys = {
  'color-scheme': $colorScheme,
  'dynamic-range-limit': $dynamicRangeLimit,
  'forced-color-adjust': $forcedColorAdjust,
  'print-color-adjust': $printColorAdjust,
}
