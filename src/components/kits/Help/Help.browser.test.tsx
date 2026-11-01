/** 独立帮助入口接受动态模板并保持锚定，内容清空后释放提示。 */
import { afterEach, beforeEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render, createState, val } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import { cssRoot } from '@/style-system'
import { Help } from './Help'

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

test('独立使用默认圆圈问号，模板持续更新，清空内容保留入口并释放浮层', async () => {
  const count = createState(12)
  const visible = createState(false)
  dispose = render(
    () => (
      <Help
        name="样本说明"
        tooltip={
          val(visible) ? <Piv as="strong">成立{val(count)}次</Piv> : undefined
        }
      />
    ),
    host,
  )
  const trigger = host.querySelector('button')!
  expect(trigger.textContent).toBe('?')
  expect(trigger.type).toBe('button')
  expect(trigger.getAttribute('aria-label')).toBe('样本说明')
  expect(getComputedStyle(trigger).borderRadius).toBe('50%')
  expect(host.querySelector('[role="tooltip"]')).toBeNull()
  visible.set(true)
  await expect.poll(() => host.querySelector('[role="tooltip"]')).not.toBeNull()
  await userEvent.hover(trigger)
  const surface = host.querySelector<HTMLElement>('[role="tooltip"]')!
  await expect.poll(() => surface.matches(':popover-open')).toBe(true)
  expect(trigger.getAttribute('aria-describedby')).toBe(surface.id)
  expect(getComputedStyle(surface).positionAnchor).toBe(
    getComputedStyle(trigger).anchorName,
  )
  count.set(13)
  await expect.poll(() => surface.textContent).toBe('成立13次')
  visible.set(false)
  await expect.poll(() => host.querySelector('[role="tooltip"]')).toBeNull()
  expect(host.querySelector('button')).toBe(trigger)
  expect(trigger.textContent).toBe('?')
})
