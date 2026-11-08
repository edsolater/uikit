/** 真实宿主复用、Source更新、实例隔离与附属结构退出。 */
import { afterEach, beforeEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createState, render, val, type JSXElement } from '@/foundation'
import { cssRoot } from '@/style-system'
import { Piv } from '../../../Piv/Piv'
import { tooltip, type TooltipController } from './tooltip'
import { popover } from '@/components/plugins/kits/Popover/popover'
import { Button } from '@/components/kits/Button/Button'
import { Card } from '@/components/kits/Card/Card'
import { PopoverSurface } from '@/components/kits/Popover/PopoverSurface'
import {
  createPopoverVisibilityController,
  type PopoverVisibilityController,
} from '@/components/kits/Popover/createPopoverVisibilityController'
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

/**
 * 从浏览器实际闭合轮廓读取第一个箭头尖端，返回其视口坐标。
 */
function readOutlineTip(surface: HTMLElement) {
  const paint = surface.querySelector<HTMLElement>('.PopoverPaint')!
  const shape = getComputedStyle(paint).getPropertyValue('border-shape')
  const tip = shape.match(/,\s*line to ([-\d.]+)(px|%) ([-\d.]+)(px|%)/)!
  const rect = paint.getBoundingClientRect()
  return {
    x: rect.left + parseFloat(tip[1]) * (tip[2] === '%' ? rect.width / 100 : 1),
    y: rect.top + parseFloat(tip[3]) * (tip[4] === '%' ? rect.height / 100 : 1),
  }
}

test('默认打开反映原生状态，取消打开不伪报成功，强制切换及关闭恢复焦点', async () => {
  let controller!: PopoverVisibilityController
  let cancel = true
  dispose = render(() => {
    const [current, bindings] = createPopoverVisibilityController({
      onBeforeToggle: (open, event) => {
        if (open && cancel) event.preventDefault()
      },
    })
    controller = current
    const { popoverTrigger, popoverBody } = popover({ popoverBody: { defaultOpen: true } })
    return (
      <>
        <Button is={popoverTrigger} disabled htmlProps={{ 'aria-busy': 'false' }}>默认打开</Button>
        <Card is={popoverBody}>默认正文</Card>
        <Piv as="button" domRef={bindings.triggerDomRef}>控制目标</Piv>
        <PopoverSurface popover="manual" domRef={bindings.popoverDomRef}>
          受控正文
        </PopoverSurface>
      </>
    )
  }, host)
  const defaultPopover = host.querySelector<HTMLElement>('[data-plugin~=popover-body]')!
  const defaultTrigger = host.querySelector<HTMLButtonElement>('button')!
  expect(defaultTrigger.disabled).toBe(true)
  // aria-busy缺省与false都表示当前未忙碌。
  expect(defaultTrigger.getAttribute('aria-busy') ?? 'false').toBe('false')
  await expect
    .poll(() => defaultPopover.matches(':popover-open'))
    .toBe(true)
  await expect
    .poll(() => defaultTrigger.getAttribute('aria-expanded'))
    .toBe('true')
  controller.showPopover!()
  expect(val(controller.isOpen!)).toBe(false)
  controller.togglePopover(true)
  expect(val(controller.isOpen!)).toBe(false)
  cancel = false
  controller.togglePopover()
  expect(
    host.querySelector('.PopoverSurface')!.matches(':popover-open'),
  ).toBe(true)
  await expect.poll(() => val(controller.isOpen!)).toBe(true)
  controller.togglePopover(false)
  await expect.poll(() => val(controller.isOpen!)).toBe(false)
  expect(document.activeElement?.textContent).toBe('控制目标')
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
  content.set(undefined)
  await expect.poll(() => host.querySelector('[role="tooltip"]')).toBeNull()
  expect(val(controller.isOpen)).toBe(false)
  content.set('再次出现')
  await expect
    .poll(() => host.querySelector('[role="tooltip"]')?.textContent)
    .toBe('再次出现')
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
  const tip = readOutlineTip(surface)
  expect(
    Math.abs(
      tip.x - (trigger.getBoundingClientRect().left + trigger.offsetWidth / 2),
    ),
  ).toBeLessThan(2)
  expect(
    Math.abs(
      tip.y -
        surface.querySelector('.PopoverPaint')!.getBoundingClientRect().top,
    ),
  ).toBeLessThan(2)
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
    const { popoverTrigger, popoverBody } = popover({})
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
  expect(getComputedStyle(hint.querySelector('.PopoverPaint')!).backgroundColor).toBe('rgb(30, 41, 59)')
  await userEvent.click(trigger)
  await expect.poll(() => original.matches(':popover-open')).toBe(false)
})

test('横向浮层在右边缘翻到左侧', async () => {
  dispose = render(() => {
    const { popoverTrigger, popoverBody } = popover({ popoverBody: { anchorPosition: 'right' } })
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

test('目标移动后浮层跟随，主体保留命中', async () => {
  const offset = createState(200)
  dispose = render(() => {
    const { popoverTrigger, popoverBody } = popover({})
    return <>
      <Button is={popoverTrigger} style={{ position: 'fixed', get left() { return `${val(offset)}px` }, top: '140px' }}>目标</Button>
      <Card is={popoverBody} style={{ width: '120px' }}>浮层内容</Card>
    </>
  }, host)
  const target = host.querySelector<HTMLButtonElement>('button')!
  await userEvent.click(target)
  const surface = host.querySelector<HTMLElement>('[data-plugin~=popover-body]')!
  await expect.poll(() => surface.matches(':popover-open')).toBe(true)
  const before = surface.getBoundingClientRect().left
  offset.set(300)
  await expect.poll(() => target.getBoundingClientRect().left).toBe(300)
  await expect.poll(() => surface.getBoundingClientRect().left).toBeGreaterThan(before + 40)
  const bounds = surface.getBoundingClientRect()
  expect(surface.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2))).toBe(true)
})
