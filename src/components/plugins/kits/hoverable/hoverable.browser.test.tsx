import { flush } from 'solid-js'
/** 在真实浏览器中验证 pointer 事件、DOM 状态和实例隔离。 */
import { render } from '@solidjs/web'
import { afterEach, describe, expect, test } from 'vitest'
import { val } from '@/foundation'
import { Piv } from '../../../Piv/Piv'
import { hoverable, type HoverableController } from './hoverable'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

describe('hoverable', () => {
  test('支持三种调用模式，并让显式实例的 hover 状态相互隔离', () => {
    let firstController!: HoverableController
    let secondController!: HoverableController
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => {
      const first = hoverable()
      const second = hoverable()
      firstController = first.controller
      secondController = second.controller

      return (
        <>
          <Piv is={first} htmlProps={{ 'data-testid': 'first' }} />
          <Piv is={second} htmlProps={{ 'data-testid': 'second' }} />
          <Piv is={hoverable()} htmlProps={{ 'data-testid': 'direct' }} />
          <Piv
            is={hoverable({ initialHovered: true })}
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

    expect(first.hasAttribute('data-hovered')).toBe(false)
    expect(direct.hasAttribute('data-hovered')).toBe(false)
    expect(configured.getAttribute('data-hovered')).toBe('true')

    first.dispatchEvent(new PointerEvent('pointerenter'))
    flush()
    expect(first.getAttribute('data-hovered')).toBe('true')
    expect(second.hasAttribute('data-hovered')).toBe(false)
    expect(val(firstController.hovered)).toBe(true)
    expect(val(secondController.hovered)).toBe(false)

    first.dispatchEvent(new PointerEvent('pointerleave'))
    flush()
    expect(first.hasAttribute('data-hovered')).toBe(false)
  })
})
