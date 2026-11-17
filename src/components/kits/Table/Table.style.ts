/**
 * Table 的表格与单元格样式。
 *
 * 负责横向滚动、紧凑密度、列宽与单元格强度表达。
 *
 * 行内容和比例计算继续由调用方提供。
 */
import {
  rules,
  stateCondition,
  token,
  createJSSContent,
  surfaceColorTheme as surfaceColor,
  contentColorTheme as contentColor,
  accentColorTheme as brandColor,
  lineColor,
  colorMix,
} from '@/style-system'
import { valueSequence } from '@/style-system/pieces/token-factory/list'
import type { Source } from '@/foundation'
import type { StyleConfig } from '../../tools/styleConfig'
import { componentName } from './Table.prop'

/** 表格唯一的样式配置入口，列映射的字段可独立保持动态来源。 */
export interface TableStyleConfig<ColumnKey extends PropertyKey = PropertyKey> {
  /** 紧凑显示，正文保持单行并缩小内边距。 */
  $compact?: boolean
  /** 各列首选宽度，省略时由原生表格布局决定。 */
  $columnWidths?: Partial<Record<ColumnKey, Source<string | undefined>>>
  /** 各列最小宽度，单位为 CSS px。 */
  $columnMinWidths?: Partial<Record<ColumnKey, Source<number | undefined>>>
}

/** 根作用域只解释整张表格的显示密度。 */
type TableRootStyleConfig = Pick<TableStyleConfig, '$compact'>

/** 内部单元格绑定的标量来源，不是第二个组件 Props 入口。 */
interface TableCellStyleConfig {
  $width?: string
  $minWidth?: number
  $intensity?: number | null
}

/** 在组件根提交密度差异，所有单元格继承同一份默认或覆盖。 */
export const tableStyleConfig = {
  /**
   * 紧凑模式缩小单元格空间并保持正文单行，关闭时沿用 Token 默认。
   */
  $compact: (value) => {
    if (value) {
      tableCellPadding.set('10px 8px')
      tableCellWhiteSpace.set('nowrap')
      tableCellFontSize.set('13px')
    }
  },
} satisfies StyleConfig<TableRootStyleConfig>

/** 每个表头或单元格只收集自身列配置及强度来源。 */
export const tableCellStyleConfig = {
  /**
   * 覆盖当前单元格的首选宽度。
   */
  $width: (value) => tableColumnWidth.set(value),
  /**
   * 把当前列的最小宽度转换为 CSS 长度。
   */
  $minWidth: (value) => tableColumnMinWidth.set(`${value}px`),
  /**
   * 将业务比例交给当前单元格的着色表达式。
   */
  $intensity: (value) => tableCellIntensity.set(value ?? 0),
} satisfies StyleConfig<TableCellStyleConfig>

const tableAddress = `.${componentName}`
/** 原生表格布局决定的缺省列宽，内部节点按列覆盖。 */
export const tableColumnWidth = token('auto', {
  name: 'table-column-width',
  address: tableAddress,
})
/** 缺省不额外限制列的最小宽度。 */
export const tableColumnMinWidth = token('0px', {
  name: 'table-column-min-width',
  address: tableAddress,
})
/** 表格单元格的默认空间与文字密度。 */
export const tableCellPadding = token('12px', {
  name: 'table-cell-padding',
  address: tableAddress,
})
export const tableCellWhiteSpace = token('normal', {
  name: 'table-cell-white-space',
  address: tableAddress,
})
export const tableCellFontSize = token('inherit', {
  name: 'table-cell-font-size',
  address: tableAddress,
})
/** 无业务比例时采用最低着色强度。 */
export const tableCellIntensity = token(0, {
  name: 'table-cell-intensity',
  address: tableAddress,
})

const intensityColor = createJSSContent(
  (resolve) =>
    `rgb(from ${resolve(brandColor)} r g b / calc(0.04 + ${resolve(tableCellIntensity)} * 0.23))`,
  [brandColor, tableCellIntensity],
)

rules(tableAddress, { 'overflow-x': 'auto' })
rules(`${tableAddress} > table`, {
  'width': '100%',
  'border-collapse': 'collapse',
  'background': surfaceColor,
  'color': contentColor,
})

rules(`${tableAddress} > table > :is(thead,tbody) > tr > :is(th,td)`, {
  'padding': tableCellPadding,
  'white-space': tableCellWhiteSpace,
  'font-size': tableCellFontSize,
  'min-width': tableColumnMinWidth,
  'width': tableColumnWidth,
  'border-bottom': valueSequence('1px', 'solid', lineColor(contentColor)),
  'text-align': 'left',
  'vertical-align': 'top',
})

rules(`${tableAddress} > table > thead > tr > th`, {
  'background': colorMix([contentColor, 0.04], surfaceColor),
  'white-space': 'nowrap',
})
const intensity = stateCondition('&[data-intensity="true"]')
const background = token('transparent', {
  name: 'table-cell-background',
  state: [[intensity, intensityColor]],
})
const weight = token('normal', {
  name: 'table-cell-font-weight',
  state: [[intensity, '650']],
})
const color = token('inherit', {
  name: 'table-cell-color',
  state: [[intensity, contentColor]],
})
rules(`${tableAddress} > table > tbody > tr > td`, {
  'background-color': background,
  'font-weight': weight,
  color,
})
