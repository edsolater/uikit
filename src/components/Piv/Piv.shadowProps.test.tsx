// @vitest-environment jsdom

import { render } from 'solid-js/web'
import { describe, expect, test } from 'vitest'
import { Piv } from './Piv'

describe('Piv shadowProps', () => {
  test('接收一维数组中的多个 props 来源', () => {
    const host = document.createElement('div')
    const dispose = render(
      () => (
        <Piv
          shadowProps={[
            { class: 'first-layer' },
            { class: 'second-layer' },
            { htmlProps: { 'data-from-array': 'yes' } },
          ]}
        />
      ),
      host,
    )
    const element = host.firstElementChild as HTMLElement

    expect(element.classList.contains('first-layer')).toBe(true)
    expect(element.classList.contains('second-layer')).toBe(true)
    expect(element.getAttribute('data-from-array')).toBe('yes')

    dispose()
  })
})
