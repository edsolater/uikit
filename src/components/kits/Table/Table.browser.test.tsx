/**
 * Table 原始记录与列显示契约的浏览器验收。
 *
 * 检查合成列、动态来源、行号、提示与实际单元格样式。
 *
 * 保证应用使用公开输入即可替换自己的表格结构。
 */
import { afterEach, beforeEach, expect, test } from 'vitest'
import { createState, flush, render, val } from '@/foundation'
import { cssRoot } from '@/style-system'
import { Table } from './Table'
import { TableExample } from './Table.example'
import '@/css/all-base.css'

let host: HTMLElement
let style: HTMLStyleElement
let dispose: (() => void) | undefined
beforeEach(() => {
  host = document.body.appendChild(document.createElement('div'))
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
})
afterEach(() => {
  dispose?.()
  host.remove()
  style.remove()
})

test('空数据保留合成表头，原行与行号持续更新，提示和比例样式由表格承担', () => {
  type Row = { name: string; detail: { owner: string }; ratio: number | null }
  const first: Row = { name: '甲', detail: { owner: '小林' }, ratio: null }
  const second: Row = { name: '乙', detail: { owner: '小陈' }, ratio: 1 }
  const rows = createState<Row[]>([])
  const keys = createState<('summary' | 'name' | 'ratio')[]>([
    'summary',
    'ratio',
    'name',
  ])
  const compact = createState(true)
  dispose = render(
    () => (
      <Table
        data={rows}
        keys={keys}
        compact={compact}
        columnMinWidths={{ summary: 240 }}
        cellTitle={{ summary: (row, index) => `${row.detail.owner}:${index}` }}
        cellIntensity={{ ratio: (row) => row.ratio }}
        renderParts={{
          tableHead: {
            summary: () => '摘要',
            ratio: () => '比例',
            name: () => '名称',
          },
          tableCell: {
            summary: (value, key, row, index) => (
              <span>{`${key}:${String(value)}:${index}:${row.detail.owner}`}</span>
            ),
            name: (value, key) => `${key}:${value.toUpperCase()}`,
            ratio: (value) => (value === null ? '无比例' : `${value * 100}%`),
          },
        }}
      />
    ),
    host,
  )
  expect(
    [...host.querySelectorAll('th')].map((cell) => cell.textContent),
  ).toEqual(['摘要', '比例', '名称'])
  expect(host.querySelectorAll('tbody tr')).toHaveLength(0)
  rows.set([first, second])
  flush()
  const cells = host.querySelectorAll<HTMLTableCellElement>(
    'tbody tr:first-child td',
  )
  expect(cells[0]!.textContent).toBe('summary:undefined:0:小林')
  expect(cells[0]!.title).toBe('小林:0')
  expect(getComputedStyle(cells[0]!).minWidth).toBe('240px')
  expect(getComputedStyle(cells[0]!).whiteSpace).toBe('nowrap')
  expect(getComputedStyle(cells[0]!).fontSize).toBe('13px')
  expect(getComputedStyle(cells[0]!).backgroundColor).toBe('rgba(0, 0, 0, 0)')
  expect(getComputedStyle(cells[1]!).backgroundColor).toMatch(
    /(?:\/ 0\.04|, 0\.04)\)$/,
  )
  expect(
    getComputedStyle(host.querySelectorAll('tbody tr')[1]!.children[1]!)
      .backgroundColor,
  ).toMatch(/(?:\/ 0\.27|, 0\.27)\)$/)
  const lightSurface = getComputedStyle(
    host.querySelector('table')!,
  ).backgroundColor
  const lightForeground = getComputedStyle(cells[0]!).color
  const lightIntensity = getComputedStyle(cells[1]!).backgroundColor
  const previousTheme = document.documentElement.getAttribute('data-theme')
  document.documentElement.setAttribute('data-theme', 'dark')
  expect(
    getComputedStyle(host.querySelector('table')!).backgroundColor,
  ).not.toBe(lightSurface)
  expect(getComputedStyle(cells[0]!).color).not.toBe(lightForeground)
  expect(getComputedStyle(cells[1]!).backgroundColor).not.toBe(lightIntensity)
  expect(getComputedStyle(cells[1]!).color).not.toBe(
    getComputedStyle(host.querySelector('table')!).backgroundColor,
  )
  if (previousTheme === null)
    document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', previousTheme)
  rows.set([second, first])
  compact.set(false)
  flush()
  expect(host.querySelector('tbody td')!.textContent).toBe(
    'summary:undefined:0:小陈',
  )
  expect(host.querySelector<HTMLTableCellElement>('tbody td')!.title).toBe(
    '小陈:0',
  )
  expect(getComputedStyle(host.querySelector('tbody td')!).whiteSpace).toBe(
    'normal',
  )
  keys.set(['name'])
  flush()
  expect(host.querySelectorAll('th')).toHaveLength(1)
  expect(host.querySelector('tbody td')!.textContent).toBe('name:乙')
})

test('可选单元格提示未提供或清空时没有原生title，提示随原始行和索引更新', () => {
  const rows = createState([
    { name: '甲', p95: 0.499 },
    { name: '乙', p95: 0.5 },
  ])
  const hint = createState<string | undefined>(undefined)
  dispose = render(
    () => (
      <Table
        data={rows}
        keys={['p95', 'summary']}
        cellTitle={{
          summary: (row, index) =>
            val(hint) === undefined
              ? undefined
              : `${val(hint)}:${row.name}:${index}`,
        }}
        renderParts={{
          tableCell: {
            p95: (value) => `${value * 100}%`,
            summary: (_value, _key, row) => row.name,
          },
        }}
      />
    ),
    host,
  )
  expect(
    [...host.querySelectorAll('td')].every(
      (cell) => !cell.hasAttribute('title'),
    ),
  ).toBe(true)
  hint.set('说明')
  flush()
  expect(host.querySelectorAll('td')[1]!.getAttribute('title')).toBe(
    '说明:甲:0',
  )
  expect(host.querySelector('td')!.hasAttribute('title')).toBe(false)
  rows.set([
    { name: '乙', p95: 0.5 },
    { name: '甲', p95: 0.499 },
  ])
  flush()
  expect(host.querySelectorAll('td')[1]!.getAttribute('title')).toBe(
    '说明:乙:0',
  )
  hint.set(undefined)
  flush()
  expect(
    [...host.querySelectorAll('td')].every(
      (cell) => !cell.hasAttribute('title'),
    ),
  ).toBe(true)
})

test('默认列来自当前首行，示例实际呈现普通与合成列内容', () => {
  dispose = render(
    () => (
      <Table
        data={['共同', '新增']}
        keys={['summary']}
        renderParts={{
          tableCell: {
            summary: (_value, _key, row, index) => `${row}:${index}`,
          },
        }}
      />
    ),
    host,
  )
  expect(
    [...host.querySelectorAll('td')].map((cell) => cell.textContent),
  ).toEqual(['共同:0', '新增:1'])
  dispose()
  const rows = createState([{ first: '初始' }])
  dispose = render(() => <Table data={rows} />, host)
  expect(host.querySelector('th')!.textContent).toBe('first')
  rows.set([{ first: '更新' }])
  flush()
  expect(host.querySelector('td')!.textContent).toBe('更新')
  dispose()
  dispose = render(
    () => (
      <Table
        data={[{ nested: '外表' }]}
        columnMinWidths={{ nested: 240 }}
        renderParts={{
          tableCell: { nested: () => <Table data={[{ value: '内表' }]} /> },
        }}
      />
    ),
    host,
  )
  expect(getComputedStyle(host.querySelector('td td')!).minWidth).toBe('0px')
  dispose()
  dispose = render(() => <TableExample />, host)
  expect(host.querySelectorAll('table')).toHaveLength(2)
  expect(host.textContent).toContain('1. 接口整理 · 小林')
  expect(host.textContent).toContain('50%')
})
