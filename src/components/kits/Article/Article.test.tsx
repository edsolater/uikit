// @vitest-environment jsdom

import { render } from '@solidjs/web'
import { afterEach, describe, expect, test } from 'vitest'
import { Card } from '../Card/Card'
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
    dispose = render(
      () => <Article htmlProps={{ 'data-testid': 'article' }}>正文</Article>,
      host,
    )

    const article = document.querySelector<HTMLElement>(
      '[data-testid="article"]',
    )!
    expect(article.tagName).toBe('ARTICLE')
    expect(article.textContent).toBe('正文')
    expect(host.children).toHaveLength(1)
  })

  test('Card 在外承载 Article，保留各自容器与语义边界', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <Card class="example-card" large>
          <Article htmlProps={{ 'data-testid': 'card-article' }}>
            卡片正文
          </Article>
        </Card>
      ),
      host,
    )

    const article = document.querySelector<HTMLElement>(
      '[data-testid="card-article"]',
    )!
    expect(article.tagName).toBe('ARTICLE')
    expect(article.classList.contains('Card')).toBe(false)
    expect(article.hasAttribute('data-size')).toBe(false)
    const card = article.parentElement!
    expect(host.firstElementChild).toBe(card)
    expect(card.tagName).toBe('DIV')
    expect(card.classList.contains('Card')).toBe(true)
    expect(card.classList.contains('example-card')).toBe(true)
    expect(card.getAttribute('data-size')).toBe('large')
    expect(article.hasAttribute('data-variant')).toBe(false)
    expect(article.textContent).toBe('卡片正文')
    expect(host.children).toHaveLength(1)
  })
})
