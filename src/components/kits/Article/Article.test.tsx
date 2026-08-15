// @vitest-environment jsdom

import { render } from 'solid-js/web'
import { afterEach, describe, expect, test } from 'vitest'
import { Card } from '../Card'
import { Article } from './Article'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

describe('Article', () => {
  test('默认直接输出原生 article', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => (
      <Article htmlProps={{ 'data-testid': 'article' }}>正文</Article>
    ), host)

    const article = document.querySelector<HTMLElement>('[data-testid="article"]')!
    expect(article.tagName).toBe('ARTICLE')
    expect(article.textContent).toBe('正文')
    expect(host.children).toHaveLength(1)
  })

  test('由 Card 承载时不增加 DOM，并让 Card 使用 article 节点', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => (
      <Article
        as={Card}
        class="example-card"
        large
        htmlProps={{ 'data-testid': 'card-article' }}
      >
        卡片正文
      </Article>
    ), host)

    const article = document.querySelector<HTMLElement>('[data-testid="card-article"]')!
    expect(article.tagName).toBe('ARTICLE')
    expect(article.classList.contains('Card')).toBe(true)
    expect(article.classList.contains('example-card')).toBe(true)
    expect(article.getAttribute('data-size')).toBe('large')
    expect(article.hasAttribute('data-variant')).toBe(false)
    expect(article.textContent).toBe('卡片正文')
    expect(host.children).toHaveLength(1)
  })
})
