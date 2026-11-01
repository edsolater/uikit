/** 验证真实原生浮层事件在触发时消费最新的组件回调。 */
import { afterEach, expect, test, vi } from 'vitest'
import { flush, render, val } from '@/foundation'
import { Popover, type PopoverController } from './Popover'

let dispose: (() => void) | undefined
afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

test('组件顶层公开身份与浮层操作，props干预内容且不替代打开状态', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  let controller!: PopoverController
  dispose = render(() => <Popover trigger="打开" title="原标题"
    ref={current => { controller = current }}>说明</Popover>, host)
  const surface = host.querySelector<HTMLElement>('.PopoverSurface')!
  const trigger = host.querySelector<HTMLButtonElement>('.trigger')!
  expect(surface.id).toBe(controller.popoverId)
  expect(trigger.id).toBe(controller.triggerId)
  expect(val(controller.isOpen)).toBe(false)

  controller.props.title.set('运行期标题')
  flush()
  expect(surface.querySelector('.header')?.textContent).toBe('运行期标题')
  expect(val(controller.isOpen)).toBe(false)
  controller.showPopover()
  await expect.poll(() => surface.matches(':popover-open')).toBe(true)
  await expect.poll(() => val(controller.isOpen)).toBe(true)
  controller.hidePopover()
  await expect.poll(() => surface.matches(':popover-open')).toBe(false)
  await expect.poll(() => val(controller.isOpen)).toBe(false)
  expect(document.activeElement).toBe(trigger)
  controller.togglePopover(true)
  await expect.poll(() => surface.matches(':popover-open')).toBe(true)
  await expect.poll(() => val(controller.isOpen)).toBe(true)
  controller.togglePopover(false)
  await expect.poll(() => surface.matches(':popover-open')).toBe(false)
  await expect.poll(() => val(controller.isOpen)).toBe(false)
})

test('运行期替换回调后，原生打开和关闭只调用事件发生时的最新回调', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const originalToggle = vi.fn()
  const originalBefore = vi.fn()
  const openingToggle = vi.fn()
  const openingBefore = vi.fn()
  const closingToggle = vi.fn()
  const closingBefore = vi.fn()
  let controller!: PopoverController
  dispose = render(() => <Popover
    ref={current => { controller = current }}
    trigger="打开"
    onToggle={originalToggle}
    onBeforeToggle={originalBefore}
  >说明</Popover>, host)
  const surface = host.querySelector<HTMLElement>('.PopoverSurface')!
  expect('defaultOpen' in controller.props).toBe(false)
  controller.props.onToggle.set(() => openingToggle)
  controller.props.onBeforeToggle.set(() => openingBefore)
  flush()
  expect(openingToggle).not.toHaveBeenCalled()
  expect(openingBefore).not.toHaveBeenCalled()
  surface.showPopover()
  await expect.poll(() => openingToggle.mock.calls.length).toBe(1)
  expect(surface.matches(':popover-open')).toBe(true)
  expect(openingToggle.mock.calls[0][0]).toBe(true)
  expect(openingToggle.mock.calls[0][1].type).toBe('toggle')
  expect(openingToggle.mock.calls[0][1].target).toBe(surface)
  expect(openingBefore).toHaveBeenCalledOnce()
  expect(openingBefore.mock.calls[0][0]).toBe(true)
  expect(openingBefore.mock.calls[0][1].type).toBe('beforetoggle')
  expect(openingBefore.mock.calls[0][1].target).toBe(surface)
  expect(originalToggle).not.toHaveBeenCalled()
  expect(originalBefore).not.toHaveBeenCalled()
  controller.props.onToggle.set(() => closingToggle)
  controller.props.onBeforeToggle.set(() => closingBefore)
  flush()
  surface.hidePopover()
  await expect.poll(() => closingToggle.mock.calls.length).toBe(1)
  expect(surface.matches(':popover-open')).toBe(false)
  expect(closingToggle.mock.calls[0][0]).toBe(false)
  expect(closingToggle.mock.calls[0][1].type).toBe('toggle')
  expect(closingToggle.mock.calls[0][1].target).toBe(surface)
  expect(closingBefore).toHaveBeenCalledOnce()
  expect(closingBefore.mock.calls[0][0]).toBe(false)
  expect(closingBefore.mock.calls[0][1].type).toBe('beforetoggle')
  expect(closingBefore.mock.calls[0][1].target).toBe(surface)
  expect(openingToggle).toHaveBeenCalledOnce()
  expect(openingBefore).toHaveBeenCalledOnce()
  expect(host.querySelector('.PopoverSurface')).toBe(surface)
})
