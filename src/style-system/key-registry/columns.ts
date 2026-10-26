/**
 * 多栏流排版的属性目标。
 *
 * 组织栏数、宽度、填充及跨栏；栏间装饰另由 gap-decoration 表达。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $columnCount = key('column-count')

export const $columnFill = key('column-fill')

export const $columnHeight = key('column-height')

export const $columnSpan = key('column-span')

export const $columnWidth = key('column-width')

export const $columnWrap = key('column-wrap')

export const $columns = key('columns')

/** 多栏流排版的 CSS 原名与具名 Key 对应表。 */
export const columnsKeys = {
  'column-count': $columnCount,
  'column-fill': $columnFill,
  'column-height': $columnHeight,
  'column-span': $columnSpan,
  'column-width': $columnWidth,
  'column-wrap': $columnWrap,
  'columns': $columns,
}
