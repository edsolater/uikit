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
import { MessageBoard } from '../MessageBoard/MessageBoard'
import { createState, render } from '@/foundation'
import { cssRoot } from '@/style-system'
import { componentBoundaries } from '@/components/ComponentMarker/ComponentMarker'
import '@/css/all-base.css'

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
