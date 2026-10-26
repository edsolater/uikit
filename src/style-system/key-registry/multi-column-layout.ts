/**
 * CSS multi-column-layout 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- column 属性族 ---

export const $columnCount = key('column-count')

export const $columnFill = key('column-fill')

export const $columnHeight = key('column-height')

export const $columnSpan = key('column-span')

export const $columnWidth = key('column-width')

export const $columnWrap = key('column-wrap')

// --- columns 属性族 ---

export const $columns = key('columns')

/** multi-column-layout 模块的 CSS 原名与具名 Key 对应表。 */
export const multiColumnLayoutKeys = {
  'column-count': $columnCount,
  'column-fill': $columnFill,
  'column-height': $columnHeight,
  'column-span': $columnSpan,
  'column-width': $columnWidth,
  'column-wrap': $columnWrap,
  'columns': $columns,
}
