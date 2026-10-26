/**
 * CSS color 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- color 属性族 ---

/** color Key，可作为 Declaration 受体或过渡目标。 */
export const $color = key('color')

export const $colorScheme = key('color-scheme')

// --- dynamic-range-limit 属性族 ---

export const $dynamicRangeLimit = key('dynamic-range-limit')

// --- forced-color-adjust 属性族 ---

export const $forcedColorAdjust = key('forced-color-adjust')

// --- opacity 属性族 ---

/** opacity Key；内容与背景的不透明度一起变化。 */
export const $opacity = key('opacity')

// --- print-color-adjust 属性族 ---

export const $printColorAdjust = key('print-color-adjust')

/** color 模块的 CSS 原名与具名 Key 对应表。 */
export const colorKeys = {
  'color': $color,
  'color-scheme': $colorScheme,
  'dynamic-range-limit': $dynamicRangeLimit,
  'forced-color-adjust': $forcedColorAdjust,
  'opacity': $opacity,
  'print-color-adjust': $printColorAdjust,
}
