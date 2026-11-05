/** 在真实浏览器中验证焦点、pointer、键盘点击和实例隔离。 */
import { render } from '@solidjs/web'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createState, val } from '@/foundation'
import { Card } from '@/components/kits/Card/Card'
import { defineInactivePlugin } from '@/components/plugins/defineInactivePlugin'
import { Piv } from '../../../Piv/Piv'
import { usePlugin } from '../../usePlugin'
import { clickable, type ClickableController } from './clickable'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

describe('clickable', () => {
  test('真实 DOM 事件更新对应 Controller，且支持三种调用模式', async () => {
    let firstController!: Partial<ClickableController>
    let secondController!: Partial<ClickableController>
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => {
      const [firstPlugin, first] = usePlugin(clickable)
      const [secondPlugin, second] = usePlugin(clickable)
      firstController = first
      secondController = second

      return (
        <>
          <Piv
            is={firstPlugin}
            htmlProps={{ 'data-testid': 'first', 'role': 'button' }}
          />
          <Piv
            is={secondPlugin}
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
    await expect.poll(() => val(firstController.hovered!)).toBe(true)
    expect(val(firstController.pressed!)).toBe(true)
    expect(val(secondController.hovered!)).toBe(false)
    expect(val(secondController.pressed!)).toBe(false)
    expect(second.hasAttribute('data-pressed')).toBe(false)

    first.dispatchEvent(new PointerEvent('pointerup'))
    await expect.poll(() => val(firstController.pressed!)).toBe(false)

    firstController.focus!()
    expect(document.activeElement).toBe(first)
    await expect.poll(() => val(firstController.focused!)).toBe(true)
    firstController.blur!()
    await expect.poll(() => val(firstController.focused!)).toBe(false)

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
  pluginCore({ element, onCleanup, addProps }) {
    child()({ element, onCleanup, addProps })
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

test('受控 Plugin 直接使用，控制独立节点并在卸载后释放', async () => {
  const host = document.body.appendChild(document.createElement('div'))
  let first: Partial<ClickableController> = {}
  let second: Partial<ClickableController> = {}
  const onClick = vi.fn()
  dispose = render(() => {
    const [firstPlugin, firstController] = usePlugin(clickable, {
      tabIndex: 2,
      onClick,
    })
    const [secondPlugin, secondController] = usePlugin(clickable)
    first = firstController
    second = secondController
    return (
      <>
        <Card
          is={firstPlugin}
          htmlProps={{ 'data-testid': 'first', 'tabIndex': 7 }}
        />
        <Card is={secondPlugin} htmlProps={{ 'data-testid': 'second' }} />
        <Card is={clickable()} htmlProps={{ 'data-testid': 'raw' }} />
      </>
    )
  }, host)
  await expect.poll(() => first.focus).toBeDefined()
  const firstElement = host.querySelector<HTMLElement>('[data-testid="first"]')!
  expect(firstElement.tabIndex).toBe(7)
  firstElement.dispatchEvent(new PointerEvent('pointerenter'))
  await expect.poll(() => val(first.hovered!)).toBe(true)
  expect(val(second.hovered!)).toBe(false)
  firstElement.dispatchEvent(
    new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }),
  )
  expect(onClick).toHaveBeenCalledOnce()
  first.focus?.()
  expect(document.activeElement).toBe(firstElement)
  dispose()
  dispose = undefined
  await expect.poll(() => first.focus).toBeUndefined()
})

test('条件隐藏时不安装 Plugin，出现与消失对应控制入口', async () => {
  const host = document.body.appendChild(document.createElement('div'))
  const visible = createState(false)
  let controller: Partial<ClickableController> = {}
  dispose = render(() => {
    const [plugin, control] = usePlugin(clickable)
    controller = control
    return <Card if={visible} is={plugin} />
  }, host)
  expect(controller.focus).toBeUndefined()
  visible.set(true)
  await expect.poll(() => controller.focus).toBeDefined()
  visible.set(false)
  await expect.poll(() => controller.focus).toBeUndefined()
})
