/**
 * CSS fragmentation 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- box 属性族 ---

export const $boxDecorationBreak = key('box-decoration-break')

// --- break 属性族 ---

export const $breakAfter = key('break-after')

export const $breakBefore = key('break-before')

export const $breakInside = key('break-inside')

// --- orphans 属性族 ---

export const $orphans = key('orphans')

// --- widows 属性族 ---

export const $widows = key('widows')

/** fragmentation 模块的 CSS 原名与具名 Key 对应表。 */
export const fragmentationKeys = {
  'box-decoration-break': $boxDecorationBreak,
  'break-after': $breakAfter,
  'break-before': $breakBefore,
  'break-inside': $breakInside,
  'orphans': $orphans,
  'widows': $widows,
}
