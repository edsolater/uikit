/** 真实宿主复用、Source更新、实例隔离与附属结构退出。 */
import { afterEach, beforeEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createState, render, val, type JSXElement } from '@/foundation'
import { cssRoot } from '@/style-system'
import { Piv } from '../../../Piv/Piv'
import { tooltip, type TooltipController } from './tooltip'
import { createPopoverPlugins } from '@/components/plugins/kits/Popover/popover'
import type { AnchorGap, AnchorPosition } from '@/components/plugins/kits/Popover/popover'
import { Button } from '@/components/kits/Button/Button'
import { Card } from '@/components/kits/Card/Card'
import '@/css/all-base.css'

let dispose: (() => void) | undefined
let host: HTMLElement
let style: HTMLStyleElement
beforeEach(() => {
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host = document.body.appendChild(document.createElement('main'))
  host.style.padding = '180px 40px'
})
afterEach(() => {
  dispose?.()
  host.remove()
  style.remove()
})

test('非Label宿主保留id与自有描述，模板动态更新且实例互不影响', async () => {
  const value = createState(1)
  let first!: TooltipController
  let second!: TooltipController
  dispose = render(() => {
    const one = tooltip({
      content: <Piv as="strong">当前{val(value)}</Piv>,
    })
    const two = tooltip({
      content: '第二个宿主',
    })
    first = one.controller
    second = two.controller
    return (
      <>
        <Piv
          as="span"
          id="own-id"
          is={one}
          htmlProps={{
            'tabIndex': 0,
            'aria-describedby': 'existing-description',
          }}
        >
          任意宿主
        </Piv>
        <Piv as="span" id="another" is={two} htmlProps={{ tabIndex: 0 }}>
          另一个
        </Piv>
      </>
    )
  }, host)
  const trigger = host.querySelector<HTMLElement>('#own-id')!
  expect(trigger.getAttribute('aria-describedby')).toBe('existing-description')
  await userEvent.hover(trigger)
  await expect.poll(() => val(first.isOpen)).toBe(true)
  expect(val(second.isOpen)).toBe(false)
  const surface = host.querySelector<HTMLElement>(':popover-open')!
  expect(getComputedStyle(surface).margin).toBe('4px')
  expect(surface.querySelector('strong')?.textContent).toBe('当前1')
  value.set(2)
  await expect
    .poll(() => surface.querySelector('strong')?.textContent)
    .toBe('当前2')
  expect(host.querySelector(':popover-open')).toBe(surface)
  trigger.focus()
  await userEvent.keyboard('{Escape}')
  await expect.poll(() => surface.matches(':popover-open')).toBe(false)
  expect(document.activeElement).toBe(trigger)
})

test('内容清空移除浮层并关闭状态，卸载释放附属结构和延迟关闭', async () => {
  const content = createState<JSXElement>('初始说明')
  let controller!: TooltipController
  dispose = render(() => {
    const capability = tooltip({ content })
    controller = capability.controller
    return (
      <Piv as="button" is={capability}>
        宿主
      </Piv>
    )
  }, host)
  await userEvent.hover(host.querySelector('button')!)
  await expect.poll(() => val(controller.isOpen)).toBe(true)
  const originalBody = host.querySelector<HTMLElement>('[role="tooltip"]')!
  content.set(undefined)
  await expect.poll(() => host.querySelector('[role="tooltip"]')).toBeNull()
  await expect.poll(() => val(controller.isOpen)).toBe(false)
  content.set('再次出现')
  await expect
    .poll(() => host.querySelector('[role="tooltip"]')?.textContent)
    .toBe('再次出现')
  expect(host.querySelector('[role="tooltip"]')).toBe(originalBody)
  controller.showPopover()
  await expect.poll(() => originalBody.matches(':popover-open')).toBe(true)
  await userEvent.hover(host)
  dispose?.()
  dispose = undefined
  await new Promise((resolve) => setTimeout(resolve, 180))
  expect(host.querySelector('[role="tooltip"]')).toBeNull()
})

test('零内容在边缘翻面，程序关闭保留焦点且新显示取消旧关闭计时', async () => {
  let controller!: TooltipController
  dispose = render(() => {
    const capability = tooltip({ content: 0 })
    controller = capability.controller
    return (
      <Piv
        as="button"
        is={capability}
        style={{ position: 'fixed', top: '8px', left: '200px' }}
      >
        零值说明
      </Piv>
    )
  }, host)
  const trigger = host.querySelector('button')!
  await expect.poll(() => host.querySelector('[role="tooltip"]')).not.toBeNull()
  trigger.focus()
  await expect
    .poll(() => host.querySelector(':popover-open')?.textContent)
    .toBe('0')
  const surface = host.querySelector<HTMLElement>('[role="tooltip"]')!
  await expect
    .poll(
      () =>
        surface.getBoundingClientRect().top >
        trigger.getBoundingClientRect().bottom,
    )
    .toBe(true)
  controller.hidePopover()
  await expect.poll(() => surface.matches(':popover-open')).toBe(false)
  expect(document.activeElement).toBe(trigger)
  trigger.blur()
  await userEvent.hover(trigger)
  await userEvent.unhover(trigger)
  controller.showPopover()
  await new Promise((resolve) => setTimeout(resolve, 180))
  expect(surface.matches(':popover-open')).toBe(true)
})

test('提示局部材料不改变按钮Popover，原触发与关闭仍可操作', async () => {
  dispose = render(() => {
    const { plugins: { trigger: popoverTrigger, body: popoverBody } } = createPopoverPlugins({})
    return <>
      <Button is={popoverTrigger} htmlProps={{ 'data-purpose': '补充' }}>打开补充内容</Button>
      <Card is={popoverBody}><h2>标题</h2>原浮层正文</Card>
      <Piv as="button" is={tooltip({ content: '简短提示' })}>提示目标</Piv>
    </>
  }, host)
  const trigger = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent === '打开补充内容')!
  const original = host.querySelector<HTMLElement>('[data-plugin~=popover-body]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(original)
  expect(trigger.getAttribute('data-purpose')).toBe('补充')
  expect(trigger.disabled).toBe(false)
  await userEvent.click(trigger)
  await expect.poll(() => original.matches(':popover-open')).toBe(true)
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  expect(original.textContent).toBe('标题原浮层正文')
  await userEvent.hover([...host.querySelectorAll<HTMLElement>('button')].find((button) => button.textContent === '提示目标')!)
  const hint = host.querySelector<HTMLElement>('[role="tooltip"]')!
  await expect.poll(() => hint.matches(':popover-open')).toBe(true)
  expect(getComputedStyle(hint).backgroundColor).toBe('rgb(30, 41, 59)')
  await userEvent.click(trigger)
  await expect.poll(() => original.matches(':popover-open')).toBe(false)
})

test('横向浮层在右边缘翻到左侧', async () => {
  dispose = render(() => {
    const { plugins: { trigger: popoverTrigger, body: popoverBody } } = createPopoverPlugins({ body: { $anchorPosition: 'right' } })
    return <>
      <Button is={popoverTrigger} style={{ position: 'fixed', right: '8px', top: '180px' }}>边缘目标</Button>
      <Card is={popoverBody}>横向补充说明</Card>
    </>
  }, host)
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  await userEvent.click(trigger)
  const surface = host.querySelector<HTMLElement>('[data-plugin~=popover-body]')!
  await expect.poll(() => surface.getBoundingClientRect().right < trigger.getBoundingClientRect().left).toBe(true)
})

test('滚动时提示正文与背景随同一浮层跟随锚点', async () => {
  dispose = render(() => (
    <div data-scroller style={{ height: '180px', overflow: 'auto' }}>
      <div style={{ height: '600px', padding: '100px 20px' }}>
        <Piv as="button" is={tooltip({ content: <strong>完整提示正文</strong> })}>目标</Piv>
      </div>
    </div>
  ), host)
  const scroller = host.querySelector<HTMLElement>('[data-scroller]')!
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  await userEvent.hover(trigger)
  const body = host.querySelector<HTMLElement>('[role="tooltip"]')!
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  const content = body.querySelector('strong')!
  const before = body.getBoundingClientRect().top
  const contentOffset = content.getBoundingClientRect().top - before
  expect(getComputedStyle(body).backgroundColor).toBe('rgb(30, 41, 59)')
  scroller.scrollTop = 40
  await expect.poll(() => body.getBoundingClientRect().top).toBeLessThan(before - 30)
  expect(content.getBoundingClientRect().top - body.getBoundingClientRect().top).toBeCloseTo(contentOffset, 0)
})

test('提示按钮不接入原生点击切换，也不把焦点移入提示正文', async () => {
  dispose = render(() => (
    <Button is={tooltip({ content: <a href="#details">补充说明</a> })}>查看</Button>
  ), host)
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  await expect.poll(() => host.querySelector('[role="tooltip"]')).not.toBeNull()
  const body = host.querySelector<HTMLElement>('[role="tooltip"]')!
  expect(trigger.popoverTargetElement).toBeNull()
  expect(trigger.hasAttribute('popovertargetaction')).toBe(false)
  expect(trigger.hasAttribute('aria-haspopup')).toBe(false)
  expect(trigger.hasAttribute('aria-expanded')).toBe(false)
  trigger.focus()
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  expect(document.activeElement).toBe(trigger)
  expect(body.querySelector('[autofocus]')).toBeNull()
  await userEvent.click(trigger)
  expect(body.matches(':popover-open')).toBe(true)
})

test('定位来源持续更新，完成值为空时回到 top 与 md 默认值', async () => {
  const position = createState<AnchorPosition | undefined>(undefined)
  const gap = createState<AnchorGap | undefined>(undefined)
  dispose = render(() => (
    <Button is={tooltip({ content: '说明', $anchorPosition: position, $anchorGap: gap })}>目标</Button>
  ), host)
  await userEvent.hover(host.querySelector('button')!)
  const body = host.querySelector<HTMLElement>('[role="tooltip"]')!
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  expect(getComputedStyle(body).positionArea).toBe('top')
  expect(getComputedStyle(body).margin).toBe('4px')
  position.set('right')
  gap.set('lg')
  await expect.poll(() => getComputedStyle(body).positionArea).toBe('right')
  await expect.poll(() => getComputedStyle(body).margin).toBe('8px')
  position.set(undefined)
  gap.set(undefined)
  await expect.poll(() => getComputedStyle(body).positionArea).toBe('top')
  await expect.poll(() => getComputedStyle(body).margin).toBe('4px')
})

test('提示的显示关闭保留 Task 等待与取消，空内容不显示', async () => {
  const content = createState<JSXElement>('说明')
  let controller!: TooltipController
  dispose = render(() => {
    const capability = tooltip({ content })
    controller = capability.controller
    return <Piv as="button" is={capability}>宿主</Piv>
  }, host)
  await expect.poll(() => host.querySelector('[role="tooltip"]')).not.toBeNull()
  const body = host.querySelector<HTMLElement>('[role="tooltip"]')!
  const canceled = controller.showPopover.lazyExec()
  canceled.cancel()
  const rejected = canceled.result.catch(error => error)
  expect((await rejected).name).toBe('AbortError')
  expect(body.matches(':popover-open')).toBe(false)
  await controller.showPopover().result
  expect(body.matches(':popover-open')).toBe(true)
  await controller.hidePopover().result
  expect(body.matches(':popover-open')).toBe(false)
  content.set('')
  await expect.poll(() => host.querySelector('[role="tooltip"]')).toBeNull()
  await controller.showPopover().result
  expect(body.matches(':popover-open')).toBe(false)
})
