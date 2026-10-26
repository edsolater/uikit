/**
 * CSS writing-modes 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- direction 属性族 ---

export const $direction = key('direction')

// --- text 属性族 ---

export const $textCombineUpright = key('text-combine-upright')

export const $textOrientation = key('text-orientation')

// --- unicode-bidi 属性族 ---

export const $unicodeBidi = key('unicode-bidi')

// --- writing-mode 属性族 ---

export const $writingMode = key('writing-mode')

/** writing-modes 模块的 CSS 原名与具名 Key 对应表。 */
export const writingModesKeys = {
  'direction': $direction,
  'text-combine-upright': $textCombineUpright,
  'text-orientation': $textOrientation,
  'unicode-bidi': $unicodeBidi,
  'writing-mode': $writingMode,
}
