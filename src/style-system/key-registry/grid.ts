/**
 * 网格布局的属性目标。
 *
 * 组织轨道、区域与网格项目放置。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $grid = key('grid')

export const $gridArea = key('grid-area')

export const $gridAutoColumns = key('grid-auto-columns')

/** grid-auto-flow Key，选择未定位 Grid 子项的自动排布方向。 */
export const $gridAutoFlow = key('grid-auto-flow')

export const $gridAutoRows = key('grid-auto-rows')

export const $gridColumn = key('grid-column')

export const $gridColumnEnd = key('grid-column-end')

export const $gridColumnStart = key('grid-column-start')

export const $gridRow = key('grid-row')

export const $gridRowEnd = key('grid-row-end')

export const $gridRowStart = key('grid-row-start')

export const $gridTemplate = key('grid-template')

export const $gridTemplateAreas = key('grid-template-areas')

export const $gridTemplateColumns = key('grid-template-columns')

export const $gridTemplateRows = key('grid-template-rows')

/** 网格布局的 CSS 原名与具名 Key 对应表。 */
export const gridKeys = {
  'grid': $grid,
  'grid-area': $gridArea,
  'grid-auto-columns': $gridAutoColumns,
  'grid-auto-flow': $gridAutoFlow,
  'grid-auto-rows': $gridAutoRows,
  'grid-column': $gridColumn,
  'grid-column-end': $gridColumnEnd,
  'grid-column-start': $gridColumnStart,
  'grid-row': $gridRow,
  'grid-row-end': $gridRowEnd,
  'grid-row-start': $gridRowStart,
  'grid-template': $gridTemplate,
  'grid-template-areas': $gridTemplateAreas,
  'grid-template-columns': $gridTemplateColumns,
  'grid-template-rows': $gridTemplateRows,
}
