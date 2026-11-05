/** 在真实浏览器中验证焦点、pointer、键盘点击和实例隔离。 */
import { render } from '@solidjs/web'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { val } from '@/foundation'
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
    let firstController!: ClickableController
    let secondController!: ClickableController
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
          <Piv is={clickable} htmlProps={{ 'data-testid': 'direct' }} />
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

    firstController.focus()
    expect(document.activeElement).toBe(first)
    await expect.poll(() => val(firstController.focused)).toBe(true)
    firstController.blur()
    await expect.poll(() => val(firstController.focused)).toBe(false)

    const onClick = vi.fn()
    first.addEventListener('click', onClick)
    first.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }),
    )
    expect(onClick).toHaveBeenCalledOnce()
  })
})
