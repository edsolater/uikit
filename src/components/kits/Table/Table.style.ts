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

const intensityColor = createJSSContent(
  (resolve) =>
    `rgb(from ${resolve(brandColor)} r g b / calc(0.04 + var(--table-cell-intensity) * 0.23))`,
  [brandColor],
)

rules('.Table', { 'overflow-x': 'auto' })
rules('.Table > table', {
  'width': '100%',
  'border-collapse': 'collapse',
  'background': surfaceColor,
  'color': contentColor,
})

const compact = stateCondition('&[data-compact="true"]')
const padding = token('12px', {
  name: 'table-cell-padding',
  state: [[compact, '10px 8px']],
})
const whiteSpace = token('normal', {
  name: 'table-cell-white-space',
  state: [[compact, 'nowrap']],
})
const fontSize = token('inherit', {
  name: 'table-cell-font-size',
  state: [[compact, '13px']],
})
rules('.Table > table > :is(thead,tbody) > tr > :is(th,td)', {
  padding,
  'white-space': whiteSpace,
  'font-size': fontSize,
  'min-width': 'var(--table-column-min-width)',
  'width': 'var(--table-column-width)',
  'border-bottom': valueSequence('1px', 'solid', lineColor(contentColor)),
  'text-align': 'left',
  'vertical-align': 'top',
})

rules('.Table > table > thead > tr > th', {
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
rules('.Table > table > tbody > tr > td', {
  'background-color': background,
  'font-weight': weight,
  color,
})
