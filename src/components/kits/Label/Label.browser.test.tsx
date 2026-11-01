/** 在真实浏览器验证字段关联、悬停阅读和键盘退出，不绑定内部状态。 */
import { afterEach, beforeEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render, createState, flush, val } from '@/foundation'
import { createRef } from '@/hooks/createRef'
import { Piv } from '@/components/Piv/Piv'
import { cssRoot } from '@/style-system'
import { Label, type LabelController } from './Label'

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
afterEach(() => {
  dispose?.()
  host.remove()
  style.remove()
})

test('组件ref可改变字段关联并添加和移除缺省提示，集合随实例清理', async () => {
  const [label, receive] = createRef<LabelController>()
  dispose = render(() => <>
    <Label for="first-input" ref={receive}>原标题</Label>
    <Label for="first-input">普通标题</Label>
    <Piv as="input" id="first-input" />
    <Piv as="input" id="next-input" />
  </>, host)
  expect(Label.controllers.length).toBe(1)
  expect('ref' in Label.controllers[0]).toBe(false)
  expect(host.querySelector('button')).toBeNull()
  label.for?.set('next-input')
  label.children?.set('新标题')
  label.tooltip?.set('运行期说明')
  label.tooltipTrigger?.set('i')
  flush()
  const title = host.querySelector('label')!
  const trigger = host.querySelector('button')!
  expect(title.textContent).toBe('新标题')
  await userEvent.click(title)
  expect(document.activeElement).toBe(host.querySelector('#next-input'))
  expect(trigger.textContent).toBe('i')
  expect(trigger.getAttribute('aria-label')).toBe('新标题说明')
  await userEvent.hover(trigger)
  const surface = host.querySelector<HTMLElement>('[role="tooltip"]')!
  await expect.poll(() => surface.matches(':popover-open')).toBe(true)
  expect(surface.textContent).toBe('运行期说明')
  label.tooltip?.set(undefined)
  flush()
  expect(host.querySelector('button')).toBeNull()
  expect(host.querySelector('[role="tooltip"]')).toBeNull()
  dispose()
  dispose = undefined
  expect(Label.controllers.length).toBe(0)
})

test('标题聚焦独立输入，空说明不生成问号，动态标题持续更新', async () => {
  const title = createState('原标题')
  dispose = render(
    () => (
      <>
        <Label for="label-input">{title}</Label>
        <Piv as="input" id="label-input" />
      </>
    ),
    host,
  )
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
  style.textContent +=
    'label { text-box-trim:trim-both; text-box-edge:cap alphabetic; }'
  dispose = render(
    () => (
      <>
        <Label for="help-input" tooltip="完整说明内容">
          字段
        </Label>
        <Piv as="input" id="help-input" />
        <Label for="plain-input">字段</Label>
        <Piv as="input" id="plain-input" />
      </>
    ),
    host,
  )
  const trigger = host.querySelector('button')!
  const surface = host.querySelector<HTMLElement>('[role="tooltip"]')!
  const input = host.querySelector('input')!
  const before = input.getBoundingClientRect().toJSON()
  const labels = host.querySelectorAll('.Label')
  expect(labels[0].getBoundingClientRect().height).toBe(
    labels[1].getBoundingClientRect().height,
  )
  expect(
    getComputedStyle(host.querySelector('label')!).getPropertyValue(
      'text-box-trim',
    ),
  ).toBe('trim-both')
  await userEvent.hover(trigger)
  await expect.poll(() => surface.matches(':popover-open')).toBe(true)
  expect(getComputedStyle(surface).positionAnchor).toBe(
    getComputedStyle(trigger).anchorName,
  )
  expect(surface.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    trigger.getBoundingClientRect().top,
  )
  expect(input.getBoundingClientRect().toJSON()).toEqual(before)
  await userEvent.hover(surface)
  await new Promise((resolve) => setTimeout(resolve, 200))
  expect(surface.matches(':popover-open')).toBe(true)
  await userEvent.hover(input)
  await expect.poll(() => surface.matches(':popover-open')).toBe(false)
  expect(document.activeElement).not.toBe(trigger)
})

test('键盘聚焦显示，Escape关闭不抢焦点，重新移入可再次查看', async () => {
  dispose = render(
    () => (
      <>
        <Label for="keyboard-input" tooltip="键盘说明">
          字段
        </Label>
        <Piv as="input" id="keyboard-input" />
      </>
    ),
    host,
  )
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

test('自定义触发内容与JSX段落复用同插件，Source清空回到问号', async () => {
  const triggerContent = createState<string | undefined>('i')
  const value = createState(129)
  dispose = render(() => (
    <>
      <Label
        for="template-input"
        tooltipTrigger={triggerContent}
        tooltip={<>
          <Piv as="strong">命中{val(value)}</Piv>
          <Piv as="p">共同有效域</Piv>
        </>}
      >
        字段
      </Label>
      <Piv as="input" id="template-input" />
    </>
  ), host)
  const trigger = host.querySelector('button')!
  expect(trigger.textContent).toBe('i')
  expect(trigger.querySelector('button')).toBeNull()
  await userEvent.hover(trigger)
  const surface = host.querySelector<HTMLElement>('[role="tooltip"]')!
  await expect.poll(() => surface.matches(':popover-open')).toBe(true)
  expect(surface.querySelector('p')?.textContent).toBe('共同有效域')
  value.set(130)
  await expect
    .poll(() => surface.querySelector('strong')?.textContent)
    .toBe('命中130')
  triggerContent.set(undefined)
  await expect.poll(() => trigger.textContent).toBe('?')
  host.style.minHeight = '200vh'
  window.scrollTo(0, 40)
  await expect.poll(() =>
    surface.getBoundingClientRect().bottom <= trigger.getBoundingClientRect().top,
  ).toBe(true)
  window.scrollTo(0, 0)
})
