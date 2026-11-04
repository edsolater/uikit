/**
 * Table 的表格与单元格样式。
 *
 * 负责横向滚动、紧凑密度、列宽与单元格强度表达。
 *
 * 行内容和比例计算继续由调用方提供。
 */
import { rules, stateCondition, token } from '@/style-system'

rules('.Table', { 'overflow-x': 'auto' })
rules('.Table > table', { width: '100%', 'border-collapse': 'collapse', background: 'var(--color-surface)', color: 'var(--color-fg)' })

const compact = stateCondition('&[data-compact="true"]')
const padding = token('12px', { name: 'table-cell-padding', state: [[compact, '10px 8px']] })
const whiteSpace = token('normal', { name: 'table-cell-white-space', state: [[compact, 'nowrap']] })
const fontSize = token('inherit', { name: 'table-cell-font-size', state: [[compact, '13px']] })
rules('.Table > table > :is(thead,tbody) > tr > :is(th,td)', {
  padding,
  'white-space': whiteSpace,
  'font-size': fontSize,
  'min-width': 'var(--table-column-min-width)',
  'border-bottom': '1px solid var(--color-line-soft)',
  'text-align': 'left',
  'vertical-align': 'top',
})

rules('.Table > table > thead > tr > th', { background: 'var(--color-surface-low)', 'white-space': 'nowrap' })
const intensity = stateCondition('&[data-intensity="true"]')
const background = token('transparent', { name: 'table-cell-background', state: [[intensity, 'rgb(from var(--color-accent) r g b / calc(0.04 + var(--table-cell-intensity) * 0.23))']] })
const weight = token('normal', { name: 'table-cell-font-weight', state: [[intensity, '650']] })
const color = token('inherit', { name: 'table-cell-color', state: [[intensity, 'var(--color-fg-strong)']] })
rules('.Table > table > tbody > tr > td', { 'background-color': background, 'font-weight': weight, color })
