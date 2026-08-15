// @vitest-environment jsdom

import { render } from 'solid-js/web'
import { afterEach, describe, expect, test } from 'vitest'
import { createState } from '../../../hooks'
import { Popover } from './Popover'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

describe('Popover', () => {
  test('确定位置描述词输出 data-placement', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Popover right trigger="打开">内容</Popover>, host)
    const popover = host.firstElementChild as HTMLElement

    expect(popover.getAttribute('data-placement')).toBe('right')
    expect(popover.classList.contains('placement:right')).toBe(false)
  })

  test('动态 placement 持续更新位置描述', () => {
    const placement = createState<'top' | 'right' | 'bottom' | 'left' | undefined>()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Popover placement={placement} trigger="打开">内容</Popover>, host)
    const popover = host.firstElementChild as HTMLElement

    expect(popover.hasAttribute('data-placement')).toBe(false)

    placement.set('top')
    expect(popover.getAttribute('data-placement')).toBe('top')
  })

  test('defaultOpen 通过内部状态输出 open Status 并更新 aria-expanded', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Popover defaultOpen trigger="打开">内容</Popover>, host)
    const popover = host.firstElementChild as HTMLElement
    const trigger = popover.querySelector<HTMLButtonElement>('.trigger')!

    expect(popover.getAttribute('data-status')).toBe('open')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })
})
