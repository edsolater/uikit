// @vitest-environment jsdom

import { render } from 'solid-js/web'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createState } from '../../../hooks'
import { Card } from './Card'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

describe('Card', () => {
  test('保留原生元素语义、组合 class 并输出确定 Brand', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => (
      <Card
        as="article"
        class="example-card"
        solid
        large
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

  test('省略 Brand Props 时使用 undefined 默认结果', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Card>默认卡片</Card>, host)

    const card = host.firstElementChild as HTMLElement
    expect(card.hasAttribute('data-tone')).toBe(false)
    expect(card.hasAttribute('data-size')).toBe(false)
  })

  test('tone 字段可以动态选择 Brand，并优先于 soft', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const tone = createState<'soft' | 'solid' | undefined>()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Card soft tone={tone}>动态卡片</Card>, host)
    const card = host.firstElementChild as HTMLElement

    expect(card.hasAttribute('data-tone')).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('“tone”接管整个分组'))

    tone.set('solid')
    expect(card.getAttribute('data-tone')).toBe('solid')
  })
})
