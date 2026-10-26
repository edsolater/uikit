/**
 * 表格网格的属性目标。
 *
 * 组织表格布局、单元格间隔/边框合并、空单元格及标题位置；不接管普通盒子外框。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $borderCollapse = key('border-collapse')

export const $borderSpacing = key('border-spacing')

export const $captionSide = key('caption-side')

export const $emptyCells = key('empty-cells')

export const $tableLayout = key('table-layout')

/** 表格网格的 CSS 原名与具名 Key 对应表。 */
export const tableKeys = {
  'border-collapse': $borderCollapse,
  'border-spacing': $borderSpacing,
  'caption-side': $captionSide,
  'empty-cells': $emptyCells,
  'table-layout': $tableLayout,
}
