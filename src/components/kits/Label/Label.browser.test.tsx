/** 在真实浏览器验证字段关联、悬停阅读和键盘退出，不绑定内部状态。 */
import { afterEach, beforeEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render, createState } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import { cssRoot } from '@/style-system'
import { Label } from './Label'

let dispose: (() => void) | undefined
let host: HTMLElement
let style: HTMLStyleElement
beforeEach(() => {
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host = document.body.appendChild(document.createElement('main'))
  host.style.padding = '180px 40px 40px'
})
afterEach(() => { dispose?.(); host.remove(); style.remove() })

test('标题聚焦独立输入，空说明不生成问号，动态标题持续更新', async () => {
  const title = createState('原标题')
  dispose = render(() => <>
    <Label for="label-input">{title}</Label>
    <Piv as="input" id="label-input" />
  </>, host)
  const label = host.querySelector('label')!
  const input = host.querySelector('input')!
  await userEvent.click(label)
  expect(document.activeElement).toBe(input)
  expect(input.labels?.[0]).toBe(label)
  expect(host.querySelector('button')).toBeNull()
  title.set('新标题')
  await expect.poll(() => label.textContent).toBe('新标题')
})

test('悬停浮层在上方且不改变输入排版，可以移入说明继续阅读', async () => {
  host.style.font = '10px/normal serif'
  style.textContent += 'label { text-box-trim:trim-both; text-box-edge:cap alphabetic; }'
  dispose = render(() => <>
    <Label for="help-input" help="完整说明内容">字段</Label>
    <Piv as="input" id="help-input" />
    <Label for="plain-input">字段</Label>
    <Piv as="input" id="plain-input" />
  </>, host)
  const trigger = host.querySelector('button')!
  const surface = host.querySelector<HTMLElement>('[role="tooltip"]')!
  const input = host.querySelector('input')!
  const before = input.getBoundingClientRect().toJSON()
  const labels = host.querySelectorAll('.Label')
  expect(labels[0].getBoundingClientRect().height).toBe(labels[1].getBoundingClientRect().height)
  expect(getComputedStyle(host.querySelector('label')!).getPropertyValue('text-box-trim')).toBe('trim-both')
  await userEvent.hover(trigger)
  await expect.poll(() => surface.matches(':popover-open')).toBe(true)
  expect(surface.getBoundingClientRect().bottom).toBeLessThanOrEqual(trigger.getBoundingClientRect().top)
  expect(input.getBoundingClientRect().toJSON()).toEqual(before)
  await userEvent.hover(surface)
  await new Promise(resolve => setTimeout(resolve, 200))
  expect(surface.matches(':popover-open')).toBe(true)
  await userEvent.hover(input)
  await expect.poll(() => surface.matches(':popover-open')).toBe(false)
  expect(document.activeElement).not.toBe(trigger)
})

test('键盘聚焦显示，Escape关闭不抢焦点，重新移入可再次查看', async () => {
  dispose = render(() => <>
    <Label for="keyboard-input" help="键盘说明">字段</Label>
    <Piv as="input" id="keyboard-input" />
  </>, host)
  const trigger = host.querySelector('button')!
  const surface = host.querySelector<HTMLElement>('[role="tooltip"]')!
  trigger.focus()
  await expect.poll(() => surface.matches(':popover-open')).toBe(true)
  await userEvent.keyboard('{Escape}')
  await expect.poll(() => surface.matches(':popover-open')).toBe(false)
  expect(document.activeElement).toBe(trigger)
  await userEvent.hover(host.querySelector('input')!)
  await userEvent.hover(trigger)
  await expect.poll(() => surface.matches(':popover-open')).toBe(true)
})
