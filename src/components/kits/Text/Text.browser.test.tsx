/**
 * Text的真实浏览器行为验收。
 *
 * 验证定位框内文字不可见但仍保有真实排版，关闭恢复最新来源。
 *
 * 通过正式FAB和组件入口排除额外状态、旧文本缓存与布局占位。
 */
import { render } from '@solidjs/web'
import { flush } from 'solid-js'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  test,
} from 'vitest'
import { cssRoot } from '@/style-system'
import { createState, Show } from '@/foundation'
import {
  Button,
  Piv,
  StructureViewFab,
  Text,
  type TextProps,
} from '@/components'
import '@/css/all-base.css'

let dispose: (() => void) | undefined
let styleHost: HTMLStyleElement

beforeEach(() => {
  styleHost = document.head.appendChild(document.createElement('style'))
  styleHost.id = 'css-root'
  cssRoot.mount()
})

afterEach(() => {
  dispose?.()
  dispose = undefined
  styleHost.remove()
  document.body.replaceChildren()
})

/**
 * 点击正式的组件定位框开关。
 */
function toggleView() {
  document.querySelector<HTMLButtonElement>('.StructureViewFab')!.click()
  flush()
}

describe('Text', () => {
  test('定位框隐藏文字但保留尺寸与节点，隐藏期间继续更新并恢复最新内容', async () => {
    const content = createState('原文字')
    const showFab = createState(false)
    const host = document.body.appendChild(document.createElement('main'))
    dispose = render(
      () => (
        <>
          <Text descriptionDisplay style={{ display: 'inline-block' }}>
            {content}
          </Text>
          <Piv as="span" style={{ display: 'inline-block' }}>
            {content}
          </Piv>
          <Button>按钮原文字</Button>
          <Show when={showFab.read()}>
            <StructureViewFab />
          </Show>
        </>
      ),
      host,
    )
    const text = host.querySelector<HTMLElement>('.Text')!
    const reference = host.querySelectorAll('span')[1]
    const button = host.querySelector('button')!
    const before = text.getBoundingClientRect().toJSON()
    expect(getComputedStyle(text).visibility).toBe('visible')
    showFab.set(true)
    flush()
    expect(getComputedStyle(text).visibility).toBe('visible')

    toggleView()
    await expect.poll(() => getComputedStyle(text).visibility).toBe('hidden')
    await expect
      .poll(() =>
        [...document.querySelectorAll('.StructureViewOverlay .label')].some(
          (element) => element.textContent === 'Text',
        ),
      )
      .toBe(true)
    expect(text.textContent).toBe('原文字')
    expect(text.getBoundingClientRect().toJSON()).toEqual(before)
    expect(button.textContent).toBe('按钮原文字')
    expect(getComputedStyle(button).visibility).toBe('visible')

    content.set('隐藏期间更新后的更长文字')
    flush()
    expect(text.textContent).toBe('隐藏期间更新后的更长文字')
    expect(getComputedStyle(text).visibility).toBe('hidden')
    expect(text.getBoundingClientRect().width).toBe(
      reference.getBoundingClientRect().width,
    )
    expect(text.getBoundingClientRect().width).toBeGreaterThan(before.width)
    const updated = text.getBoundingClientRect().toJSON()
    toggleView()
    expect(host.querySelector('.Text')).toBe(text)
    expect(getComputedStyle(text).visibility).toBe('visible')
    expect(text.textContent).toBe('隐藏期间更新后的更长文字')
    expect(text.getBoundingClientRect().toJSON()).toEqual(updated)

    toggleView()
    expect(getComputedStyle(text).visibility).toBe('hidden')
    showFab.set(false)
    flush()
    expect(getComputedStyle(text).visibility).toBe('visible')
    expect(text.textContent).toBe('隐藏期间更新后的更长文字')
  })

  test('缺省和false使用span，block与p互斥选择div和段落并保留说明协议', async () => {
    expectTypeOf<{ block: true; p: true }>().not.toExtend<TextProps>()
    expectTypeOf<{ block: false; p: false }>().not.toExtend<TextProps>()
    expectTypeOf<'as'>().not.toExtend<keyof TextProps>()
    const description = createState<string | undefined>('当前说明')
    const host = document.body.appendChild(document.createElement('main'))
    dispose = render(
      () => (
        <>
          <Text descriptionDisplay>行内文字</Text>
          <Text block={false} descriptionDisplay>
            行内说明
          </Text>
          <Text p={false} descriptionDisplay>
            行内段落说明
          </Text>
          <Text block description={description}>
            说明
          </Text>
          <Text p descriptionDisplay>
            {42}
          </Text>
          <StructureViewFab />
        </>
      ),
      host,
    )
    expect([...host.children].map((element) => element.tagName)).toEqual([
      'SPAN',
      'SPAN',
      'SPAN',
      'DIV',
      'P',
      'BUTTON',
    ])
    toggleView()
    await expect
      .poll(() =>
        [...document.querySelectorAll('.StructureViewOverlay .label')].map(
          (element) => element.textContent,
        ),
      )
      .toContain('当前说明')
    expect(
      [...document.querySelectorAll('.StructureViewOverlay .label')].some(
        (element) => element.textContent === 'Text · 当前说明',
      ),
    ).toBe(false)
    description.set('更新后的说明')
    flush()
    await expect
      .poll(() =>
        [...document.querySelectorAll('.StructureViewOverlay .label')].map(
          (element) => element.textContent,
        ),
      )
      .toContain('更新后的说明')
    description.set('')
    flush()
    await expect
      .poll(
        () =>
          [...document.querySelectorAll('.StructureViewOverlay .label')].filter(
            (element) => element.textContent === 'Text',
          ).length,
      )
      .toBe(4)
    description.set(undefined)
    flush()
    await expect
      .poll(
        () =>
          [...document.querySelectorAll('.StructureViewOverlay .label')].filter(
            (element) => element.textContent === 'Text',
          ).length,
      )
      .toBe(4)
    expect(
      [...host.querySelectorAll('.Text')].every(
        (element) => getComputedStyle(element).visibility === 'hidden',
      ),
    ).toBe(true)
    expect(host.querySelector('p.Text')?.textContent).toBe('42')
  })

  test('默认跟随外部说明真值，显式boolean优先且false不读取异步默认', async () => {
    const description = createState<string | undefined>()
    const display = createState<boolean | undefined>()
    const host = document.body.appendChild(document.createElement('main'))
    dispose = render(
      () => (
        <>
          <Text description={description} descriptionDisplay={display.read()}>
            动态说明文字
          </Text>
          <Text
            description={new Promise<string>(() => {})}
            descriptionDisplay={false}
          >
            无需等待的文字
          </Text>
          <StructureViewFab />
        </>
      ),
      host,
    )
    const text = host.querySelector<HTMLElement>('.Text')!
    expect(getComputedStyle(text).opacity).toBe('1')
    toggleView()
    await expect.poll(() => getComputedStyle(text).opacity).toBe('0')
    expect(
      document.querySelectorAll('.StructureViewOverlay .label'),
    ).toHaveLength(0)
    description.set('用途')
    flush()
    await expect.poll(() => getComputedStyle(text).opacity).toBe('1')
    await expect
      .poll(
        () =>
          document.querySelector('.StructureViewOverlay .label')?.textContent,
      )
      .toBe('用途')
    display.set(false)
    flush()
    await expect.poll(() => getComputedStyle(text).opacity).toBe('0')
    description.set('')
    display.set(true)
    flush()
    await expect
      .poll(
        () =>
          document.querySelector('.StructureViewOverlay .label')?.textContent,
      )
      .toBe('Text')
    display.set(undefined)
    flush()
    await expect.poll(() => getComputedStyle(text).opacity).toBe('0')
    let resolveDescription!: (value: string) => void
    description.set(
      new Promise<string>((resolve) => {
        resolveDescription = resolve
      }),
    )
    flush()
    resolveDescription('异步用途')
    await expect
      .poll(
        () =>
          document.querySelector('.StructureViewOverlay .label')?.textContent,
      )
      .toBe('异步用途')
    toggleView()
    await expect.poll(() => getComputedStyle(text).opacity).toBe('1')
    expect(text.textContent).toBe('动态说明文字')
  })
})
