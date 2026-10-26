/**
 * CSS table 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- border 属性族 ---

export const $borderCollapse = key('border-collapse')

export const $borderSpacing = key('border-spacing')

// --- caption-side 属性族 ---

export const $captionSide = key('caption-side')

// --- empty-cells 属性族 ---

export const $emptyCells = key('empty-cells')

// --- table-layout 属性族 ---

export const $tableLayout = key('table-layout')

/** table 模块的 CSS 原名与具名 Key 对应表。 */
export const tableKeys = {
  'border-collapse': $borderCollapse,
  'border-spacing': $borderSpacing,
  'caption-side': $captionSide,
  'empty-cells': $emptyCells,
  'table-layout': $tableLayout,
}
