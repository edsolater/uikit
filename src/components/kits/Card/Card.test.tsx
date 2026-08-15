// @vitest-environment jsdom

import { render } from 'solid-js/web'
import { afterEach, describe, expect, test } from 'vitest'
import { Card } from './Card'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

describe('Card', () => {
  test('保留原生元素语义、组合 class 并输出稳定画像', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => (
      <Card
        as="article"
        class="example-card"
        tone="solid"
        size="large"
        htmlProps={{ 'aria-label': 'Example detail', 'data-testid': 'card' }}
      >
        内容
      </Card>
    ), host)

    const card = document.querySelector<HTMLElement>('[data-testid="card"]')!
    expect(card.tagName).toBe('ARTICLE')
    expect(card.classList.contains('Card')).toBe(true)
    expect(card.classList.contains('example-card')).toBe(true)
    expect(card.getAttribute('data-tone')).toBe('solid')
    expect(card.getAttribute('data-size')).toBe('large')
    expect(card.getAttribute('aria-label')).toBe('Example detail')
    expect(card.textContent).toBe('内容')
  })

  test('省略 tone 和 size 时使用默认画像', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Card>默认卡片</Card>, host)

    const card = host.firstElementChild as HTMLElement
    expect(card.hasAttribute('data-tone')).toBe(false)
    expect(card.hasAttribute('data-size')).toBe(false)
  })
})
