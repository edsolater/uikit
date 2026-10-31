import { flush } from 'solid-js'
// @vitest-environment jsdom

import { render } from '@solidjs/web'
import { afterEach, describe, expect, test } from 'vitest'
import { createState } from '@/foundation'
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
    dispose = render(
      () => (
        <Popover right trigger="打开">
          内容
        </Popover>
      ),
      host,
    )
    const popover = host.firstElementChild as HTMLElement

    expect(popover.getAttribute('data-placement')).toBe('right')
    expect(popover.classList.contains('placement:right')).toBe(false)
  })

  test('动态 placement 持续更新位置描述', () => {
    const placement = createState<
      'top' | 'right' | 'bottom' | 'left' | undefined
    >()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <Popover placement={placement} trigger="打开">
          内容
        </Popover>
      ),
      host,
    )
    const popover = host.firstElementChild as HTMLElement

    expect(popover.hasAttribute('data-placement')).toBe(false)

    placement.set('top')
    flush()
    expect(popover.getAttribute('data-placement')).toBe('top')
  })

})
