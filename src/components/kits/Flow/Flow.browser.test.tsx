/**
 * 共享排列、导航与反馈的浏览器行为验证。
 *
 * 检查来源更新、实际布局与链接状态，不绑定样式编译的内部表示。
 *
 * 保护组合时的原生语义和各实例之间的隔离。
 */
import { Button } from '../Button/Button'
import type { ButtonController } from '../Button/Button.prop'
import { buttonGap } from '../Button/Button.style'
import { cssTokenName } from '@/style-system/token/css'
import { Grid } from '../Grid/Grid'
import { NavigationRegion } from '../NavigationRegion/NavigationRegion'
import { afterEach, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import '../../../css/all-base.css'
import { createState, render, type Val } from '@/foundation'
import { clickable } from '../../plugins/kits/clickable/clickable'
import { cssRoot } from '@/style-system'
import { DirectionSwitchingExample } from './examples/direction-switching'
import { Flow } from './Flow'
import type { FlowController, FlowProps } from './Flow.prop'
import { MessageBoard } from '../MessageBoard/MessageBoard'
import { Link } from '../Link/Link'
import { componentBoundaries } from '../../tools/ComponentIdentityMarker/ComponentIdentityMarker'

let dispose: (() => void) | undefined
let host: HTMLElement
let style: HTMLStyleElement
afterEach(() => {
  dispose?.()
  host?.remove()
  style?.remove()
})

test('显式方向快捷保持来源优先级和实际输入顺序，横排不残留纵排配套规则', () => {
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host = document.body.appendChild(document.createElement('main'))
  dispose = render(
    () => (
      <>
        <Flow $direction="column" $row />
        <Flow $direction="row" $styleConfig={{ $col: true }} />
        <Flow $col $row />
        <Flow $row $col />
        <Flow $col $row $styleConfig={{ $row: true, $col: true }} />
        <Flow $row $col $styleConfig={{ $col: true, $row: true }} />
        <Flow $col $styleConfig={{ $col: false }} />
        <Flow $direction="column" $styleConfig={{ $row: false }} />
        <Flow $col $styleConfig={{ $direction: undefined }} />
        <Flow $styleConfig={{ $col: true, $row: true }} />
      </>
    ),
    host,
  )
  const expected = [
    'column',
    'column',
    'row',
    'column',
    'column',
    'row',
    'row',
    'column',
    'row',
    'row',
  ]
  for (const [index, element] of [...host.children].entries()) {
    const computed = getComputedStyle(element)
    const column = expected[index] === 'column'
    expect([
      computed.flexDirection,
      computed.flexWrap,
      computed.alignItems,
    ]).toEqual(
      column ? ['column', 'nowrap', 'normal'] : ['row', 'wrap', 'center'],
    )
  }
})

test('快捷Source和显式顺序持续更新，Controller替换或清空保持节点及实例边界', async () => {
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host = document.body.appendChild(document.createElement('main'))
  const column = createState<boolean | undefined>(true)
  const explicit = createState<Val<FlowProps['$styleConfig']>>()
  const boundaries = componentBoundaries.size
  let controller!: FlowController
  dispose = render(
    () => (
      <Flow
        $col={column}
        $styleConfig={explicit}
        ref={(value) => {
          controller = value
        }}
      >
        <Flow>后代内容</Flow>
      </Flow>
    ),
    host,
  )
  const root = host.firstElementChild!
  const child = root.firstElementChild!
  expect(getComputedStyle(root).flexDirection).toBe('column')
  expect(getComputedStyle(child).flexDirection).toBe('row')
  expect(componentBoundaries.size).toBe(boundaries + 2)
  column.set(false)
  await expect.poll(() => getComputedStyle(root).flexDirection).toBe('row')
  column.set(true)
  await expect.poll(() => getComputedStyle(root).flexDirection).toBe('column')
  explicit.set({ $row: true })
  await expect.poll(() => getComputedStyle(root).flexDirection).toBe('row')
  explicit.set({ $row: true, $col: true })
  await expect.poll(() => getComputedStyle(root).flexDirection).toBe('column')
  explicit.set({ $col: true, $row: true })
  await expect.poll(() => getComputedStyle(root).flexDirection).toBe('row')
  controller.props.$styleConfig.set({ $col: true })
  await expect.poll(() => getComputedStyle(root).flexDirection).toBe('column')
  controller.props.$styleConfig.set(undefined)
  await expect.poll(() => getComputedStyle(root).flexDirection).toBe('row')
  expect(getComputedStyle(root).flexWrap).toBe('wrap')
  expect(getComputedStyle(root).alignItems).toBe('center')
  expect(host.firstElementChild).toBe(root)
  expect(root.firstElementChild).toBe(child)
  dispose()
  dispose = undefined
  expect(componentBoundaries.size).toBe(boundaries)
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
        <Grid $columns={columns}>
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
  const direction = createState<'row' | 'column'>('column')
  dispose = render(
    () => (
      <Grid $columns={columns}>
        <Flow $direction={direction}>
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
  expect(getComputedStyle(outer!).flexDirection).toBe('column')
  expect(getComputedStyle(outer!).flexWrap).toBe('nowrap')
  expect(getComputedStyle(outer!).alignItems).toBe('normal')
  expect(getComputedStyle(inner!).flexDirection).toBe('row')
  expect(getComputedStyle(inner!).flexWrap).toBe('wrap')
  expect(getComputedStyle(inner!).alignItems).toBe('center')
  expect(getComputedStyle(outer!).gap).toBe('16px')
  expect(outer!.hasAttribute('data-direction')).toBe(false)
  direction.set('row')
  columns.set(3)
  await expect.poll(() => getComputedStyle(outer!).flexDirection).toBe('row')
  await expect.poll(() => getComputedStyle(outer!).flexWrap).toBe('wrap')
  expect(getComputedStyle(outer!).alignItems).toBe('center')
  expect(outer!.style.length).toBe(0)
  expect(getComputedStyle(inner!).flexDirection).toBe('row')
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
  ] satisfies Array<['error' | 'success' | 'warning', string]>) {
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
  const grow = createState<boolean | undefined>(false)
  const label = createState('固定分栏')
  const columns = createState<number | string>(3)
  dispose = render(
    () => (
      <Flow>
        <Flow
          label={label}
          $direction="column" $width={width} $grow={grow}
        >
          <Grid
            $columns={columns} $responsive={false}
            label="内容列"
          >
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
  expect(container!.hasAttribute('data-grow')).toBe(false)
  grow.set(false)
  await expect.poll(() => getComputedStyle(container!).flexGrow).toBe('0')
  expect(container!.style.getPropertyValue('--flow-flex')).toBe('')
  grow.set(true)
  await expect.poll(() => getComputedStyle(container!).flexGrow).toBe('1')
  grow.set(undefined)
  await expect.poll(() => getComputedStyle(container!).flexGrow).toBe('0')
  expect(container!.style.getPropertyValue('--flow-flex')).toBe('')
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

/** 通用配置与字段来源必须连接到同一实例，不能只支持初始快照。 */
test('样式配置可整体替换，字段来源持续更新且不会泄漏到子根', async () => {
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host = document.body.appendChild(document.createElement('main'))
  const gap = createState('12px')
  const input = createState<Val<FlowProps['$styleConfig']>>({
    $gap: gap,
    $direction: 'column',
  })
  let controller: FlowController
  dispose = render(
    () => (
      <Flow
        $styleConfig={input}
        ref={(value) => {
          controller = value
        }}
      >
        <Flow>内部内容</Flow>
      </Flow>
    ),
    host,
  )
  const [outer, inner] = host.querySelectorAll<HTMLElement>('.Flow')
  expect(getComputedStyle(outer!).gap).toBe('12px')
  expect(getComputedStyle(outer!).flexDirection).toBe('column')
  expect(getComputedStyle(inner!).flexDirection).toBe('row')
  expect(getComputedStyle(inner!).gap).toBe('16px')
  gap.set('20px')
  await expect.poll(() => getComputedStyle(outer!).gap).toBe('20px')
  input.set({ $gap: '24px', $direction: 'row' })
  await expect.poll(() => getComputedStyle(outer!).gap).toBe('24px')
  await expect.poll(() => getComputedStyle(outer!).flexDirection).toBe('row')
  controller!.props.$styleConfig.set({ $gap: '32px', $direction: 'column' })
  await expect.poll(() => getComputedStyle(outer!).gap).toBe('32px')
  await expect.poll(() => getComputedStyle(outer!).flexDirection).toBe('column')
  controller!.props.$styleConfig.set(undefined)
  await expect.poll(() => getComputedStyle(outer!).gap).toBe('16px')
  await expect.poll(() => getComputedStyle(outer!).flexDirection).toBe('row')
  expect(getComputedStyle(outer!).flexWrap).toBe('wrap')
  expect(getComputedStyle(outer!).alignItems).toBe('center')
  expect(getComputedStyle(inner!).gap).toBe('16px')
  expect(outer!.style.length).toBe(0)
  expect(outer!.hasAttribute('data-direction')).toBe(false)
  expect(outer!.hasAttribute('data-grow')).toBe(false)
})

test('不提供样式配置时直接采用组件默认效果，不写实例覆盖', () => {
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host = document.body.appendChild(document.createElement('main'))
  host.style.width = '480px'
  dispose = render(() => <Flow>默认内容</Flow>, host)
  const flow = host.querySelector<HTMLElement>('.Flow')!
  const computed = getComputedStyle(flow)
  expect(flow.style.length).toBe(0)
  expect(flow.hasAttribute('data-direction')).toBe(false)
  expect(flow.hasAttribute('data-grow')).toBe(false)
  expect(computed.width).toBe('480px')
  expect(computed.gap).toBe('16px')
  expect(computed.flexDirection).toBe('row')
  expect(computed.flexWrap).toBe('wrap')
  expect(computed.alignItems).toBe('center')
  expect(computed.flexGrow).toBe('0')
})

/** 真实示例应通过公开样式输入交互，保持按钮及排列主体身份。 */
test('示例切换动作方向并保留原有组件节点', async () => {
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host = document.body.appendChild(document.createElement('main'))
  dispose = render(() => <DirectionSwitchingExample />, host)
  const actions = host.querySelectorAll<HTMLElement>('.Flow')[1]!
  const button = actions.querySelector('button')
  expect(getComputedStyle(actions).flexDirection).toBe('row')
  await userEvent.click(page.getByRole('button', { name: '切换排列方向' }))
  await expect
    .poll(() => getComputedStyle(actions).flexDirection)
    .toBe('column')
  expect(actions.querySelector('button')).toBe(button)
  await userEvent.click(page.getByRole('button', { name: '切换排列方向' }))
  await expect.poll(() => getComputedStyle(actions).flexDirection).toBe('row')
  expect(actions.querySelector('button')).toBe(button)
  expect(actions.hasAttribute('data-direction')).toBe(false)
})

/** Button 的样式解释只覆盖当前实例，其他按钮继续采用 Token 默认。 */
test('按钮间距配置支持来源与控制器替换，清空不修改共享默认', async () => {
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host = document.body.appendChild(document.createElement('main'))
  const gap = createState('12px')
  const original = buttonGap.default
  let controller!: ButtonController
  dispose = render(
    () => (
      <>
        <Button
          $gap={gap}
          ref={(value) => {
            controller = value
          }}
        >
          第一项
        </Button>
        <Button>第二项</Button>
      </>
    ),
    host,
  )
  const [first, second] = host.querySelectorAll<HTMLButtonElement>('button')
  const defaultGap = getComputedStyle(second!).gap
  expect(getComputedStyle(first!).gap).toBe('12px')
  gap.set('20px')
  await expect.poll(() => getComputedStyle(first!).gap).toBe('20px')
  controller.props.$styleConfig.set({ $gap: '32px' })
  await expect.poll(() => getComputedStyle(first!).gap).toBe('32px')
  expect(getComputedStyle(second!).gap).toBe(defaultGap)
  controller.props.$styleConfig.set(undefined)
  await expect.poll(() => getComputedStyle(first!).gap).toBe(defaultGap)
  expect(first!.style.getPropertyValue(cssTokenName(buttonGap))).toBe('')
  expect(buttonGap.default).toBe(original)
})

/** Flow 继承的原生声明必须到达同一根，不只存在于类型。 */
test('声明式 Flow 转交 Piv 字段与能力，来源和控制器沿原消费链更新', async () => {
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host = document.body.appendChild(document.createElement('main'))
  const id = createState('flow-native-first')
  const className = createState('flow-native-first-class')
  const title = createState('初始标题')
  const click = vi.fn()
  let element!: HTMLDivElement
  let controller!: FlowController
  dispose = render(
    () => (
      <Flow
        as="div"
        id={id}
        class={className}
        htmlProps={{ title }}
        style={{ 'padding-left': '7px' }}
        on={{ click }}
        shadowProps={{
          class: 'flow-native-shadow',
          htmlProps: { 'data-shadow': '补充' },
        }}
        is={clickable({ tabIndex: 4 })}
        domRef={(value) => {
          element = value
        }}
        ref={(value) => {
          controller = value
        }}
      >
        原生内容
      </Flow>
    ),
    host,
  )
  expect(element).toBe(host.firstElementChild)
  expect(element.tagName).toBe('DIV')
  expect(element.id).toBe('flow-native-first')
  expect(element.classList.contains('Flow')).toBe(true)
  expect(element.classList.contains('flow-native-shadow')).toBe(true)
  expect(element.classList.contains('flow-native-first-class')).toBe(true)
  expect(element.title).toBe('初始标题')
  expect(element.getAttribute('data-shadow')).toBe('补充')
  expect(element.style.paddingLeft).toBe('7px')
  expect(element.tabIndex).toBe(4)
  element.click()
  expect(click).toHaveBeenCalledTimes(1)
  id.set('flow-native-next')
  className.set('flow-native-next-class')
  title.set('更新标题')
  await expect.poll(() => element.id).toBe('flow-native-next')
  await expect
    .poll(() => element.classList.contains('flow-native-next-class'))
    .toBe(true)
  await expect.poll(() => element.title).toBe('更新标题')
  controller.props.id.set('flow-native-controlled')
  controller.props.children.set('控制器内容')
  await expect.poll(() => element.id).toBe('flow-native-controlled')
  await expect.poll(() => element.textContent).toBe('控制器内容')
  expect(element).toBe(host.firstElementChild)
  expect(Object.hasOwn(controller.props, 'ref')).toBe(false)
})
