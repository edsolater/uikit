/** 在真实浏览器中验证焦点、pointer、键盘点击和实例隔离。 */
import { render } from 'solid-js/web'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { val } from '../../../../hooks'
import { Piv } from '../../../Piv'
import { usePlugin } from '../../usePlugin'
import { clickable, type ClickableController } from './clickable'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

describe('clickable', () => {
  test('真实 DOM 事件更新对应 Controller，且支持三种调用模式', () => {
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
          <Piv plugin={firstPlugin} htmlProps={{ 'data-testid': 'first', role: 'button' }} />
          <Piv plugin={secondPlugin} htmlProps={{ 'data-testid': 'second', role: 'button' }} />
          <Piv plugin={clickable} htmlProps={{ 'data-testid': 'direct' }} />
          <Piv plugin={clickable({ tabIndex: 2 })} htmlProps={{ 'data-testid': 'configured' }} />
        </>
      )
    }, host)

    const first = document.querySelector<HTMLElement>('[data-testid="first"]')!
    const second = document.querySelector<HTMLElement>('[data-testid="second"]')!
    const direct = document.querySelector<HTMLElement>('[data-testid="direct"]')!
    const configured = document.querySelector<HTMLElement>('[data-testid="configured"]')!

    expect(first.tabIndex).toBe(0)
    expect(direct.tabIndex).toBe(0)
    expect(configured.tabIndex).toBe(2)

    first.dispatchEvent(new PointerEvent('pointerenter'))
    first.dispatchEvent(new PointerEvent('pointerdown'))
    expect(val(firstController.hovered)).toBe(true)
    expect(val(firstController.pressed)).toBe(true)
    expect(val(secondController.hovered)).toBe(false)
    expect(val(secondController.pressed)).toBe(false)
    expect(second.hasAttribute('data-pressed')).toBe(false)

    first.dispatchEvent(new PointerEvent('pointerup'))
    expect(val(firstController.pressed)).toBe(false)

    firstController.focus()
    expect(document.activeElement).toBe(first)
    expect(val(firstController.focused)).toBe(true)
    firstController.blur()
    expect(val(firstController.focused)).toBe(false)

    const onClick = vi.fn()
    first.addEventListener('click', onClick)
    first.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
