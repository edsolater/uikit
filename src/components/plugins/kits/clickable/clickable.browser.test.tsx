/** 在真实浏览器中验证焦点、pointer、键盘点击和实例隔离。 */
import { render } from '@solidjs/web'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createState, val } from '@/foundation'
import { Card } from '@/components/kits/Card/Card'
import { defineInactivePlugin } from '@/components/plugins/tools/defineInactivePlugin'
import { Piv } from '../../../Piv/Piv'
import { clickable, type ClickableController } from './clickable'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

describe('clickable', () => {
  test('真实 DOM 事件更新对应 Controller，且支持三种调用模式', async () => {
    let firstController!: ClickableController
    let secondController!: ClickableController
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => {
      const first = clickable()
      const second = clickable()
      firstController = first.controller
      secondController = second.controller

      return (
        <>
          <Piv
            is={first}
            htmlProps={{ 'data-testid': 'first', 'role': 'button' }}
          />
          <Piv
            is={second}
            htmlProps={{ 'data-testid': 'second', 'role': 'button' }}
          />
          <Piv is={clickable()} htmlProps={{ 'data-testid': 'direct' }} />
          <Piv
            is={clickable({ tabIndex: 2 })}
            htmlProps={{ 'data-testid': 'configured' }}
          />
        </>
      )
    }, host)

    const first = document.querySelector<HTMLElement>('[data-testid="first"]')!
    const second = document.querySelector<HTMLElement>(
      '[data-testid="second"]',
    )!
    const direct = document.querySelector<HTMLElement>(
      '[data-testid="direct"]',
    )!
    const configured = document.querySelector<HTMLElement>(
      '[data-testid="configured"]',
    )!

    expect(first.tabIndex).toBe(0)
    expect(direct.tabIndex).toBe(0)
    expect(configured.tabIndex).toBe(2)

    first.dispatchEvent(new PointerEvent('pointerenter'))
    first.dispatchEvent(new PointerEvent('pointerdown'))
    await expect.poll(() => val(firstController.hovered)).toBe(true)
    expect(val(firstController.pressed)).toBe(true)
    expect(val(secondController.hovered)).toBe(false)
    expect(val(secondController.pressed)).toBe(false)
    expect(second.hasAttribute('data-pressed')).toBe(false)

    first.dispatchEvent(new PointerEvent('pointerup'))
    await expect.poll(() => val(firstController.pressed)).toBe(false)

    await firstController.focus()
    expect(document.activeElement).toBe(first)
    await expect.poll(() => val(firstController.focused)).toBe(true)
    await firstController.blur()
    await expect.poll(() => val(firstController.focused)).toBe(false)

    const onClick = vi.fn()
    first.addEventListener('click', onClick)
    first.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }),
    )
    expect(onClick).toHaveBeenCalledOnce()
  })
})

const child = defineInactivePlugin({
  name: 'child',
  pluginCore({ addProps }) {
    addProps({ htmlProps: { title: '子声明' } })
    return {}
  },
})
const parent = defineInactivePlugin({
  name: 'parent',
  pluginCore({ addProps }) {
    addProps({ is: child() })
    addProps({ htmlProps: { title: '父声明' } })
    return {}
  },
})

test('用户声明优先于父能力，父能力优先于子能力', () => {
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(
    () => (
      <>
        <Card is={parent()} />
        <Card is={parent()} htmlProps={{ title: '用户声明' }} />
      </>
    ),
    host,
  )
  const cards = host.querySelectorAll('[title]')
  expect(cards[0].getAttribute('title')).toBe('父声明')
  expect(cards[1].getAttribute('title')).toBe('用户声明')
})

test('能力结果直接使用，控制独立节点，卸载后清理声明事件', async () => {
  const host = document.body.appendChild(document.createElement('div'))
  let first!: ClickableController
  let second!: ClickableController
  const onClick = vi.fn()
  dispose = render(() => {
    const firstCapability = clickable({ tabIndex: 2, onClick })
    const secondCapability = clickable()
    first = firstCapability.controller
    second = secondCapability.controller
    return (
      <>
        <Card
          is={firstCapability}
          htmlProps={{ 'data-testid': 'first', 'tabIndex': 7 }}
        />
        <Card is={secondCapability} htmlProps={{ 'data-testid': 'second' }} />
        <Card is={clickable()} htmlProps={{ 'data-testid': 'raw' }} />
      </>
    )
  }, host)
  expect(first.focus).toBeDefined()
  const firstElement = host.querySelector<HTMLElement>('[data-testid="first"]')!
  expect(firstElement.tabIndex).toBe(7)
  firstElement.dispatchEvent(new PointerEvent('pointerenter'))
  await expect.poll(() => val(first.hovered)).toBe(true)
  expect(val(second.hovered)).toBe(false)
  firstElement.dispatchEvent(
    new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }),
  )
  expect(onClick).toHaveBeenCalledOnce()
  await first.focus()
  expect(document.activeElement).toBe(firstElement)

  dispose()
  dispose = undefined
  expect(first.focus).toBeDefined()
  expect(first.click).toBeDefined()
  await first.click()
  expect(onClick).toHaveBeenCalledOnce()
  await first.focus()
  expect(document.activeElement).not.toBe(firstElement)
})

test('条件隐藏时元素方法等待首次接入', async () => {
  const host = document.body.appendChild(document.createElement('div'))
  const visible = createState(false)
  const onClick = vi.fn()
  let controller!: ClickableController
  dispose = render(() => {
    const capability = clickable({ onClick })
    controller = capability.controller
    return <Card if={visible} is={capability} />
  }, host)
  expect(controller.focus).toBeDefined()
  const pending = controller.focus()
  expect(document.activeElement).not.toBe(host.firstElementChild)

  visible.set(true)
  await expect.poll(() => host.querySelector('.Card')).not.toBeNull()
  const element = host.querySelector<HTMLElement>('.Card')!
  await pending
  await controller.focus()
  expect(document.activeElement).toBe(element)
  await controller.click()
  expect(onClick).toHaveBeenCalledOnce()
})
