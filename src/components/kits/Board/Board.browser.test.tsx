/**
 * 承载方言与反馈材质的浏览器验证。
 *
 * 比较 Card 和 Board 的同源视觉、独立身份及动态反馈边界。
 *
 * 防止共享实现引入额外节点、样式污染或失效的动态档位。
 */
import { expect, test } from 'vitest'
import { Board } from './Board'
import { Card } from '../Card/Card'
import { Article } from '../Article/Article'
import { Heading } from '../Heading/Heading'
import { MessageBoard } from '../MessageBoard/MessageBoard'
import { createState, render } from '@/foundation'
import { cssRoot } from '@/style-system'
import { componentBoundaries } from '@/components/ComponentMarker/ComponentMarker'
import '@/css/all-base.css'

test('Article和Card裁剪自身边界，不改裸标签和Board网格', () => {
  const host = document.body.appendChild(document.createElement('div'))
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  const children = () => <>
    <Heading level={2}>首标题</Heading>
    <p>中间正文</p>
    <Heading level={2}>末标题</Heading>
  </>
  const dispose = render(() => <>
    <Article style={{ display: 'flow-root' }}>{children()}</Article>
    <Card>{children()}</Card>
    <Article as={Card}>{children()}</Article>
    <Board as="section">{children()}</Board>
    <article style={{ display: 'flow-root' }}>{children()}</article>
    <section style={{ display: 'flow-root' }}>{children()}</section>
    <div style={{ display: 'flow-root' }}>{children()}</div>
  </>, host)
  try {
    expect([...host.children].map(element => element.tagName)).toEqual(['ARTICLE', 'DIV', 'ARTICLE', 'SECTION', 'ARTICLE', 'SECTION', 'DIV'])
    for (const container of [...host.children].slice(0, 3) as HTMLElement[]) {
      const first = container.firstElementChild!, last = container.lastElementChild!
      const content = first.nextElementSibling!
      const computed = getComputedStyle(container), rect = container.getBoundingClientRect()
      const innerTop = rect.top + parseFloat(computed.paddingTop) + parseFloat(computed.borderTopWidth)
      const innerBottom = rect.bottom - parseFloat(computed.paddingBottom) - parseFloat(computed.borderBottomWidth)
      expect(getComputedStyle(container).getPropertyValue('margin-trim')).toBe('block')
      expect(first.getBoundingClientRect().top - innerTop, `${container.tagName}.${container.className}首边界`).toBeCloseTo(0, 2)
      expect(innerBottom - last.getBoundingClientRect().bottom, `${container.tagName}.${container.className}末边界`).toBeCloseTo(0, 2)
      const firstBottomMargin = parseFloat(getComputedStyle(first).marginBlockEnd)
      const lastTopMargin = parseFloat(getComputedStyle(last).marginBlockStart)
      expect(firstBottomMargin).toBeGreaterThan(0)
      expect(lastTopMargin).toBeGreaterThan(0)
      expect(content.getBoundingClientRect().top - first.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(firstBottomMargin)
      expect(last.getBoundingClientRect().top - content.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(lastTopMargin)
    }
    const board = host.children[3]!
    expect(getComputedStyle(board).display).toBe('grid')
    expect(getComputedStyle(board).getPropertyValue('margin-trim')).toBe('none')
    expect(parseFloat(getComputedStyle(board).gap)).toBeGreaterThan(0)
    for (const plain of [...host.children].slice(4)) {
      expect(getComputedStyle(plain).getPropertyValue('margin-trim')).toBe('none')
      expect(plain.firstElementChild!.getBoundingClientRect().top - plain.getBoundingClientRect().top).toBeGreaterThan(0)
      expect(plain.getBoundingClientRect().bottom - plain.lastElementChild!.getBoundingClientRect().bottom).toBeGreaterThan(0)
    }
  } finally {
    dispose()
    host.remove()
    style.remove()
  }
})

test('两种方言保持单节点同材质，反馈语气更新不污染旁边的承载', async () => {
  const host = document.body.appendChild(document.createElement('div'))
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  const variant = createState<'soft' | 'solid' | undefined>(undefined)
  const size = createState<'small' | 'large'>('small')
  const tone = createState<'info' | 'error' | 'success'>('info')
  const before = componentBoundaries.size
  const dispose = render(
    () => (
      <>
        <Board variant={variant} size={size}>
          承载
        </Board>
        <Card variant={variant} size={size}>
          独立信息
        </Card>
        <MessageBoard tone={tone}>反馈</MessageBoard>
      </>
    ),
    host,
  )
  try {
    expect(host.children).toHaveLength(3)
    const [board, card, message] = [...host.children] as HTMLElement[]
    const names = [...componentBoundaries]
      .slice(before)
      .map((boundary) => boundary.readLabel().split(' · ')[0])
    expect(names).toEqual(['Board', 'Card', 'MessageBoard', 'Board'])
    for (const property of [
      'background-color',
      'padding',
      'border',
      'border-radius',
      'box-shadow',
    ])
      expect(getComputedStyle(board).getPropertyValue(property)).toBe(
        getComputedStyle(card).getPropertyValue(property),
      )
    const originalBackground = getComputedStyle(card).backgroundColor
    const originalPadding = parseFloat(getComputedStyle(card).padding)
    variant.set('solid')
    size.set('large')
    await expect
      .poll(() => getComputedStyle(card).backgroundColor)
      .not.toBe(originalBackground)
    expect(parseFloat(getComputedStyle(card).padding)).toBeGreaterThan(
      originalPadding,
    )
    expect(getComputedStyle(card).padding).toBe(getComputedStyle(board).padding)
    const border = getComputedStyle(card).borderTopColor
    tone.set('error')
    await expect
      .poll(() => getComputedStyle(message).borderTopColor)
      .toBe('rgb(220, 38, 38)')
    expect(message.getAttribute('role')).toBe('alert')
    expect(getComputedStyle(card).borderTopColor).toBe(border)
    tone.set('success')
    await expect
      .poll(() => getComputedStyle(message).borderTopColor)
      .toBe('rgb(22, 163, 74)')
    expect(message.getAttribute('role')).toBe('status')
  } finally {
    dispose()
    host.remove()
    style.remove()
  }
})
