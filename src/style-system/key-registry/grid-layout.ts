/**
 * CSS grid-layout 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- grid 属性族 ---

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

/** grid-layout 模块的 CSS 原名与具名 Key 对应表。 */
export const gridLayoutKeys = {
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
