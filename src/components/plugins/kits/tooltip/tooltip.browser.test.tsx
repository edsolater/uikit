/** 真实宿主复用、Source更新、实例隔离与附属结构退出。 */
import { afterEach, beforeEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createState, render, val, type JSXElement } from '@/foundation'
import { cssRoot } from '@/style-system'
import { Piv } from '../../../Piv/Piv'
import { usePlugin } from '../../usePlugin'
import { tooltip, type TooltipController } from './tooltip'
import { Popover } from '@/components/kits/Popover/Popover'
import { PopoverSurface } from '@/components/Popover/PopoverSurface'
import {
  createPopoverController,
  type PopoverController,
} from '@/components/Popover/createPopoverController'
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
  let controller!: PopoverController
  let cancel = true
  dispose = render(() => {
    const [current, bindings] = createPopoverController({
      onBeforeToggle: (open, event) => {
        if (open && cancel) event.preventDefault()
      },
    })
    controller = current
    return (
      <>
        <Popover defaultOpen trigger="默认打开"
          triggerProps={{ disabled: '', 'aria-busy': 'false' }}>
          默认正文
        </Popover>
        <Piv as="button" domRef={bindings.triggerDomRef}>控制目标</Piv>
        <PopoverSurface popover="manual" domRef={bindings.popoverDomRef}>
          受控正文
        </PopoverSurface>
      </>
    )
  }, host)
  const defaultPopover = host.querySelector<HTMLElement>('.Popover')!
  const defaultTrigger = defaultPopover.querySelector('button')!
  expect(defaultTrigger.disabled).toBe(true)
  // aria-busy缺省与false都表示当前未忙碌。
  expect(defaultTrigger.getAttribute('aria-busy') ?? 'false').toBe('false')
  await expect
    .poll(() => defaultPopover.querySelector('.surface')!.matches(':popover-open'))
    .toBe(true)
  await expect
    .poll(() => defaultTrigger.getAttribute('aria-expanded'))
    .toBe('true')
  controller.showPopover()
  expect(val(controller.isOpen)).toBe(false)
  controller.togglePopover(true)
  expect(val(controller.isOpen)).toBe(false)
  cancel = false
  controller.togglePopover()
  expect(
    host.querySelectorAll('.PopoverSurface')[1].matches(':popover-open'),
  ).toBe(true)
  await expect.poll(() => val(controller.isOpen)).toBe(true)
  controller.togglePopover(false)
  await expect.poll(() => val(controller.isOpen)).toBe(false)
  expect(document.activeElement?.textContent).toBe('控制目标')
})

test('非Label宿主保留id与自有描述，模板动态更新且实例互不影响', async () => {
  const value = createState(1)
  let first!: TooltipController
  let second!: TooltipController
  dispose = render(() => {
    const [one, firstController] = usePlugin(tooltip, {
      content: <Piv as="strong">当前{val(value)}</Piv>,
    })
    const [two, secondController] = usePlugin(tooltip, {
      content: '第二个宿主',
    })
    first = firstController
    second = secondController
    return (
      <>
        <Piv
          as="span"
          id="own-id"
          plugin={one}
          htmlProps={{
            'tabIndex': 0,
            'aria-describedby': 'existing-description',
          }}
        >
          任意宿主
        </Piv>
        <Piv as="span" id="another" plugin={two} htmlProps={{ tabIndex: 0 }}>
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
    const [plugin, current] = usePlugin(tooltip, { content })
    controller = current
    return (
      <Piv as="button" plugin={plugin}>
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
    const [plugin, current] = usePlugin(tooltip, { content: 0 })
    controller = current
    return (
      <Piv
        as="button"
        plugin={plugin}
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
  dispose = render(
    () => (
      <>
        <Popover trigger="打开补充内容" title="标题"
          triggerProps={{ 'aria-busy': 'true' }}>
          原浮层正文
        </Popover>
        <Piv as="button" plugin={tooltip({ content: '简短提示' })}>
          提示目标
        </Piv>
      </>
    ),
    host,
  )
  const trigger = host.querySelector<HTMLButtonElement>('.Popover .trigger')!
  expect(trigger.getAttribute('aria-busy')).toBe('true')
  expect(trigger.disabled).toBe(false)
  await userEvent.click(trigger)
  const original = host.querySelector<HTMLElement>('.Popover .surface')!
  await expect.poll(() => original.matches(':popover-open')).toBe(true)
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  expect(original.textContent).toBe('标题原浮层正文')
  const originalPaint = original.querySelector<HTMLElement>('.PopoverPaint')!
  const background = getComputedStyle(originalPaint).backgroundImage
  expect(background).toContain('linear-gradient')
  await userEvent.hover(
    host.querySelector<HTMLElement>('button:not(.trigger)')!,
  )
  const hint = host.querySelector<HTMLElement>('[role="tooltip"]')!
  await expect.poll(() => hint.matches(':popover-open')).toBe(true)
  expect(
    getComputedStyle(hint.querySelector('.PopoverPaint')!).backgroundColor,
  ).toBe('rgb(30, 41, 59)')
  expect(getComputedStyle(originalPaint).backgroundImage).toBe(background)
  await userEvent.click(trigger)
  await expect.poll(() => original.matches(':popover-open')).toBe(false)
})

test('横向浮层在右边缘翻到左侧，箭头仍指向目标', async () => {
  dispose = render(
    () => (
      <Popover
        right
        trigger="边缘目标"
        triggerStyle={{ position: 'fixed', right: '8px', top: '180px' }}
      >
        横向补充说明
      </Popover>
    ),
    host,
  )
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  await userEvent.click(trigger)
  const surface = host.querySelector<HTMLElement>('.surface')!
  await expect
    .poll(
      () =>
        surface.getBoundingClientRect().right <
        trigger.getBoundingClientRect().left,
    )
    .toBe(true)
  const tip = readOutlineTip(surface)
  expect(
    Math.abs(
      tip.x -
        surface.querySelector('.PopoverPaint')!.getBoundingClientRect().right,
    ),
  ).toBeLessThan(2)
  expect(
    Math.abs(
      tip.y - (trigger.getBoundingClientRect().top + trigger.offsetHeight / 2),
    ),
  ).toBeLessThan(2)
})

test('边缘目标移动后完整轮廓的尖端跟随，绘制层保留同主体命中', async () => {
  const offset = createState(8)
  dispose = render(
    () => (
      <Popover
        trigger="目标"
        triggerStyle={{
          position: 'fixed',
          left: `${val(offset)}px`,
          top: '140px',
        }}
      >
        渐变背景、圆角和箭头属于同一条闭合轮廓。
      </Popover>
    ),
    host,
  )
  const target = host.querySelector<HTMLButtonElement>('button')!
  await userEvent.click(target)
  const surface = host.querySelector<HTMLElement>('.surface')!
  const paint = surface.querySelector<HTMLElement>('.PopoverPaint')!
  const readTargetCenter = () =>
    target.getBoundingClientRect().left + target.offsetWidth / 2
  await expect
    .poll(() => Math.abs(readOutlineTip(surface).x - readTargetCenter()))
    .toBeLessThan(2)
  const before = readOutlineTip(surface).x
  offset.set(60)
  await expect
    .poll(() => Math.abs(readOutlineTip(surface).x - readTargetCenter()))
    .toBeLessThan(2)
  const tip = readOutlineTip(surface)
  expect(tip.x).toBeGreaterThan(before + 40)
  const midpoint = {
    x: tip.x,
    y: (tip.y + surface.getBoundingClientRect().top) / 2,
  }
  expect(document.elementFromPoint(midpoint.x, midpoint.y)).toBe(paint)
  expect(getComputedStyle(paint).getPropertyValue('border-shape')).toContain(
    'curve to',
  )
  expect(getComputedStyle(paint).backgroundImage).toContain('linear-gradient')
})
