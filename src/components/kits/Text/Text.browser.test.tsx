/**
 * Text的真实浏览器行为验收。
 *
 * 验证定位框内文字不可见但仍保有真实排版，关闭恢复最新来源。
 *
 * 通过正式FAB和组件入口排除额外状态、旧文本缓存与布局占位。
 */
import { render } from '@solidjs/web'
import { flush } from 'solid-js'
import { afterEach, describe, expect, test } from 'vitest'
import { createState, Show } from '@/foundation'
import { Button, Piv, StructureViewFab, Text } from '@/components'
import '@/css/all-base.css'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
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
    dispose = render(() => <>
      <Text style={{ display: 'inline-block' }}>{content}</Text>
      <Piv as="span" style={{ display: 'inline-block' }}>{content}</Piv>
      <Button>按钮原文字</Button>
      <Show when={showFab.read()}><StructureViewFab /></Show>
    </>, host)
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
    await expect.poll(() => [...document.querySelectorAll('.StructureViewOverlay .label')]
      .some(element => element.textContent === 'Text')).toBe(true)
    expect(text.textContent).toBe('原文字')
    expect(text.getBoundingClientRect().toJSON()).toEqual(before)
    expect(button.textContent).toBe('按钮原文字')
    expect(getComputedStyle(button).visibility).toBe('visible')

    content.set('隐藏期间更新后的更长文字')
    flush()
    expect(text.textContent).toBe('隐藏期间更新后的更长文字')
    expect(getComputedStyle(text).visibility).toBe('hidden')
    expect(text.getBoundingClientRect().width).toBe(reference.getBoundingClientRect().width)
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

  test('保留四种原生语义及共同description协议，不增加承载元素', async () => {
    const description = createState<string | undefined>('当前说明')
    const host = document.body.appendChild(document.createElement('main'))
    dispose = render(() => <>
      <Text>行内文字</Text>
      <Text as="h2">标题</Text>
      <Text as="p" description={description}>说明</Text>
      <Text as="div">{42}</Text>
      <StructureViewFab />
    </>, host)
    expect([...host.children].map(element => element.tagName)).toEqual(['SPAN', 'H2', 'P', 'DIV', 'BUTTON'])
    toggleView()
    await expect.poll(() => [...document.querySelectorAll('.StructureViewOverlay .label')]
      .map(element => element.textContent)).toContain('当前说明')
    expect([...document.querySelectorAll('.StructureViewOverlay .label')]
      .some(element => element.textContent === 'Text · 当前说明')).toBe(false)
    description.set('更新后的说明')
    flush()
    await expect.poll(() => [...document.querySelectorAll('.StructureViewOverlay .label')]
      .map(element => element.textContent)).toContain('更新后的说明')
    description.set('')
    flush()
    await expect.poll(() => [...document.querySelectorAll('.StructureViewOverlay .label')]
      .filter(element => element.textContent === 'Text').length).toBe(4)
    description.set(undefined)
    flush()
    await expect.poll(() => [...document.querySelectorAll('.StructureViewOverlay .label')]
      .filter(element => element.textContent === 'Text').length).toBe(4)
    expect([...host.querySelectorAll('.Text')].every(element => getComputedStyle(element).visibility === 'hidden')).toBe(true)
    expect(host.querySelector('div.Text')?.textContent).toBe('42')
  })
})
