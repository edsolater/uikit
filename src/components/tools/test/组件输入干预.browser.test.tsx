/**
 * kit 接入后的组件职责边界验收。
 *
 * 验证语义组件与嵌套容器的独立输入，以及共享材质组件的候选来源与集合。
 *
 * 从实际节点和引用交付观察结果，不绑定包装内部步骤。
 */
import { afterEach, expect, test, vi } from 'vitest'
import { createState, flush, render, val } from '@/foundation'
import { Article, Board, Card, Field, Loop, Piv, type BoardController, type CardController, type ArticleController, type FieldController, type LoopController } from '@/components'
import { createRef } from '@/hooks/createRef'

let dispose: (() => void) | undefined
afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

test('Card 承载独立 Article，引用与输入各归自身节点', () => {
  const [article, receive] = createRef<ArticleController>()
  const receiver = vi.fn(receive)
  const host = document.body.appendChild(document.createElement('main'))
  const refProps = { ref: receiver }
  const conditional = createState(true)
  const classes = createState(['initial-article', { conditional }])
  const size = createState<'small' | 'large'>('large')
  let card!: CardController
  dispose = render(() => (
    <Card size={size} ref={controller => { card = controller }}>
      <Article {...refProps} class={classes} shadowProps={{ class: 'shadow-article' }} />
    </Card>
  ), host)
  const element = host.querySelector('article')!
  expect(element.tagName).toBe('ARTICLE')
  const visual = host.firstElementChild!
  expect(element.parentElement).toBe(visual)
  expect(visual.getAttribute('data-size')).toBe('large')
  expect(element.classList.contains('Card')).toBe(false)
  expect(element.classList.contains('Article')).toBe(true)
  expect(element.classList.contains('shadow-article')).toBe(true)
  expect(element.classList.contains('initial-article')).toBe(true)
  expect(element.classList.contains('conditional')).toBe(true)
  expect(element.className).not.toContain('[object')
  conditional.set(false)
  classes.set(['next-article', { conditional }])
  flush()
  expect(element.classList.contains('next-article')).toBe(true)
  expect(element.classList.contains('initial-article')).toBe(false)
  expect(element.classList.contains('conditional')).toBe(false)
  size.set('small')
  flush()
  expect(visual.getAttribute('data-size')).toBe('small')
  expect(val(card.props.size)).toBe('small')
  expect(receiver).toHaveBeenCalledOnce()
  expect(Article.controllers.length).toBe(1)
  expect(Card.controllers.length).toBe(1)
  expect('size' in Article.controllers[0].props).toBe(false)
  expect('as' in Article.controllers[0].props).toBe(false)
  const click = vi.fn()
  expect(element.textContent).toBe('')
  article.props!.children.set('更新后的正文')
  article.props!.class.set('updated-article')
  article.props!.id.set('updated-article')
  article.props!.htmlProps.set({ title: '更新后的标题' })
  article.props!.on.set({ click })
  flush()
  expect(host.children).toHaveLength(1)
  expect(host.firstElementChild).toBe(visual)
  expect(element.parentElement).toBe(visual)
  expect(element.textContent).toBe('更新后的正文')
  expect(Card.controllers.length).toBe(1)
  expect(visual.isConnected).toBe(true)
  expect(element.classList.contains('updated-article')).toBe(true)
  expect(element.classList.contains('Article')).toBe(true)
  expect(element.classList.contains('shadow-article')).toBe(true)
  expect(element.id).toBe('updated-article')
  expect(element.getAttribute('title')).toBe('更新后的标题')
  expect(click).not.toHaveBeenCalled()
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(click).toHaveBeenCalledOnce()
  dispose()
  dispose = undefined
  expect(Article.controllers.length).toBe(0)
  expect(Card.controllers.length).toBe(0)
})

test('构建工厂只通过 Props 提供，普通状态更新不重放，已有 fallback 可在后续空分支读取', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  let field!: FieldController
  let loop!: LoopController<number>
  const items = createState([1])
  const createField = vi.fn((id: string) => <Piv as="input" id={id} />)
  const createItem = vi.fn((item: number) => <Piv>{`项目${item}`}</Piv>)
  dispose = render(() => <>
    <Field label="原标题" ref={controller => { field = controller }}>{createField}</Field>
    <Loop each={() => val(items)} fallback="原占位" ref={controller => { loop = controller }}>{createItem}</Loop>
  </>, host)
  await expect.poll(() => host.querySelector('.Loop')?.textContent).toBe('项目1')
  const input = host.querySelector('input')!
  expect('children' in field.props).toBe(false)
  expect('children' in loop.props).toBe(false)
  field.props!.label.set('更新标题')
  loop.props!.description.set('更新用途')
  flush()
  expect(host.querySelector('label')?.textContent).toBe('更新标题')
  expect(host.querySelector('input')).toBe(input)
  expect(createField).toHaveBeenCalledOnce()
  expect(createItem).toHaveBeenCalledOnce()
  loop.props!.fallback.set('更新占位')
  items.set([])
  flush()
  await expect.poll(() => host.querySelector('.Loop')?.textContent).toBe('更新占位')
  expect(createField).toHaveBeenCalledOnce()
  expect(createItem).toHaveBeenCalledOnce()
})

test('kit 接入的 Board 与 Card 保留缺省候选来源和独立集合', () => {
  const [board, receiveBoard] = createRef<BoardController>()
  const [card, receiveCard] = createRef<CardController>()
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(() => <>
    <Board soft ref={receiveBoard}>承载</Board>
    <Card solid ref={receiveCard}>卡片</Card>
  </>, host)
  const [first, second] = [...host.children]
  expect(first.getAttribute('data-variant')).toBe('soft')
  expect(second.getAttribute('data-variant')).toBe('solid')
  expect(Board.controllers.length).toBe(1)
  expect(Card.controllers.length).toBe(1)
  board.props!.soft.set(false)
  board.props!.solid.set(true)
  Board.controllers.props.size.set('large')
  card.props!.children.set('独立卡片')
  flush()
  expect(first.getAttribute('data-variant')).toBe('solid')
  expect(first.getAttribute('data-size')).toBe('large')
  expect(second.hasAttribute('data-size')).toBe(false)
  expect(second.textContent).toBe('独立卡片')
  dispose()
  dispose = undefined
  expect(Board.controllers.length).toBe(0)
  expect(Card.controllers.length).toBe(0)
})
