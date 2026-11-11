/**
 * 共享排列、导航与反馈的浏览器行为验证。
 *
 * 检查来源更新、实际布局与链接状态，不绑定样式编译的内部表示。
 *
 * 保护组合时的原生语义和各实例之间的隔离。
 */
import { Grid } from '../Grid/Grid'
import { NavigationRegion } from '../NavigationRegion/NavigationRegion'
import { afterEach, expect, test } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import '../../../css/all-base.css'
import { createState, render } from '@/foundation'
import { cssRoot } from '@/style-system'
import { Flow } from './Flow'
import { MessageBoard } from '../MessageBoard/MessageBoard'
import { Link } from '../Link/Link'

let dispose: (() => void) | undefined
let host: HTMLElement
let style: HTMLStyleElement
afterEach(() => {
  dispose?.()
  host?.remove()
  style?.remove()
})

test('导航地标、当前链接和反馈语义持续反映来源，列数确实控制布局', async () => {
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host = document.body.appendChild(document.createElement('main'))
  const current = createState(false)
  const tone = createState<'info' | 'error'>('info')
  const columns = createState<1 | 2 | 3>(1)
  dispose = render(
    () => (
      <NavigationRegion label="应用切换">
        <Grid columns={columns}>
          <Link href="/target" current={current} newTab>
            目标
          </Link>
          <MessageBoard tone={tone}>反馈</MessageBoard>
        </Grid>
      </NavigationRegion>
    ),
    host,
  )
  const layout = host.querySelector<HTMLElement>('.Grid')!
  expect(host.querySelector('nav')!.getAttribute('aria-label')).toBe('应用切换')
  expect(host.querySelector('a')?.getAttribute('href')).toBe('/target')
  expect(host.querySelector('a')?.target).toBe('_blank')
  expect(host.querySelector('a')?.rel).toBe('noopener noreferrer')
  expect(host.querySelector('[role="status"]')).not.toBeNull()
  current.set(true)
  tone.set('error')
  columns.set(2)
  await expect.poll(() => getComputedStyle(layout).display).toBe('grid')
  await expect
    .poll(() => host.querySelector('a')?.getAttribute('aria-current'))
    .toBe('page')
  await expect
    .poll(() => host.querySelector('[role="alert"]')?.textContent)
    .toBe('反馈')
  await expect
    .poll(() => getComputedStyle(layout).gridTemplateColumns.split(' ').length)
    .toBe(innerWidth < 768 ? 1 : 2)
})

test('顺序流与独立分栏可组合，窄屏收为单列且嵌套方向不继承', async () => {
  await page.viewport(1024, 768)
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host = document.body.appendChild(document.createElement('main'))
  const columns = createState<1 | 2 | 3>(2)
  const direction = createState<'row' | 'column'>('row')
  dispose = render(
    () => (
      <Grid columns={columns}>
        <Flow direction={direction}>
          <Flow>内层内容</Flow>
          <Flow>第二项</Flow>
        </Flow>
        <Flow>另一列</Flow>
      </Grid>
    ),
    host,
  )
  const grid = host.querySelector<HTMLElement>('.Grid')!
  const [outer, inner] = host.querySelectorAll<HTMLElement>('.Flow')
  expect(getComputedStyle(grid).gridTemplateColumns.split(' ')).toHaveLength(2)
  expect(getComputedStyle(outer!).flexDirection).toBe('row')
  expect(getComputedStyle(inner!).flexDirection).toBe('column')
  expect(getComputedStyle(outer!).gap).toBe('16px')
  direction.set('column')
  columns.set(3)
  await expect.poll(() => getComputedStyle(outer!).flexDirection).toBe('column')
  await expect
    .poll(() => getComputedStyle(grid).gridTemplateColumns.split(' ').length)
    .toBe(3)
  await page.viewport(390, 844)
  await expect
    .poll(() => getComputedStyle(grid).gridTemplateColumns.split(' ').length)
    .toBe(1)
  await page.viewport(1024, 768)
})

test('反馈语气动态更换边框颜色，内层默认反馈不继承外层语气', async () => {
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host = document.body.appendChild(document.createElement('main'))
  const tone = createState<'info' | 'error' | 'success' | 'warning'>('info')
  dispose = render(
    () => (
      <MessageBoard tone={tone}>
        <MessageBoard>内层反馈</MessageBoard>
      </MessageBoard>
    ),
    host,
  )
  const [outer, inner] = host.querySelectorAll<HTMLElement>('.MessageBoard')
  const initialColor = getComputedStyle(inner!).borderTopColor
  for (const [next, expected] of [
    ['error', 'rgb(220, 38, 38)'],
    ['success', 'rgb(22, 163, 74)'],
    ['warning', 'rgb(217, 119, 6)'],
  ] as const) {
    tone.set(next)
    await expect
      .poll(() => getComputedStyle(outer!).borderTopColor)
      .toBe(expected)
    expect(getComputedStyle(inner!).borderTopColor).toBe(initialColor)
    expect(getComputedStyle(outer!).borderTopWidth).toBe('1px')
  }
  tone.set('info')
  await expect
    .poll(() => getComputedStyle(outer!).borderTopColor)
    .toBe(initialColor)
})

test('固定列、内容列和自动填充持续消费来源，内层布局不继承宿主宽度与列数', async () => {
  await page.viewport(1024, 768)
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host = document.body.appendChild(document.createElement('main'))
  const width = createState<string | undefined>('420px')
  const grow = createState(false)
  const label = createState('固定分栏')
  const columns = createState<number | string>(3)
  dispose = render(
    () => (
      <Flow direction="row">
        <Flow width={width} grow={grow} label={label}>
          <Grid columns={columns} responsive={false} label="内容列">
            <Grid>
              <Flow>嵌套一列</Flow>
            </Grid>
            <Flow>第二项</Flow>
            <Flow>第三项</Flow>
          </Grid>
        </Flow>
      </Flow>
    ),
    host,
  )
  const [outer, container, inner] = host.querySelectorAll<HTMLElement>('.Flow')
  const [grid, nested] = host.querySelectorAll<HTMLElement>('.Grid')
  expect(getComputedStyle(container!).width).toBe('420px')
  expect(getComputedStyle(nested!).gridTemplateColumns.split(' ')).toHaveLength(
    1,
  )
  expect(getComputedStyle(inner!).width).not.toBe('420px')
  width.set('360px')
  label.set('已更新')
  await expect.poll(() => getComputedStyle(container!).width).toBe('360px')
  await expect.poll(() => container!.getAttribute('aria-label')).toBe('已更新')
  await page.viewport(390, 844)
  await expect
    .poll(() => getComputedStyle(grid!).gridTemplateColumns.split(' ').length)
    .toBe(3)
  columns.set('repeat(8, max-content)')
  await expect
    .poll(() => getComputedStyle(grid!).gridTemplateColumns.split(' ').length)
    .toBe(8)
  columns.set('repeat(auto-fit, minmax(100px, 1fr))')
  await expect
    .poll(() => getComputedStyle(grid!).gridTemplateColumns.split(' ').length)
    .toBe(3)
  width.set(undefined)
  grow.set(true)
  await expect.poll(() => getComputedStyle(container!).flexGrow).toBe('1')
  expect(getComputedStyle(outer!).flexWrap).toBe('wrap')
  await page.viewport(1024, 768)
})

test('主题链接有可辨颜色，默认无线，悬停与当前项提供下划线反馈', async () => {
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host = document.body.appendChild(document.createElement('main'))
  const href = createState('/first')
  dispose = render(() => <Link href={href}>读取结果</Link>, host)
  const link = host.querySelector<HTMLAnchorElement>('a')!
  const plain = getComputedStyle(link)
  expect(plain.textDecorationLine).toBe('none')
  expect(plain.color).not.toBe(getComputedStyle(host).color)
  expect(CSS.supports('color', plain.color)).toBe(true)
  href.set('/second')
  await expect.poll(() => link.getAttribute('href')).toBe('/second')
  await userEvent.hover(link)
  await expect
    .poll(() => getComputedStyle(link).textDecorationLine)
    .toBe('underline')
  expect(CSS.supports('color', getComputedStyle(link).color)).toBe(true)
})
