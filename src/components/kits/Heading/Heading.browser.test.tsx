/**
 * Heading的真实浏览器行为验收。
 *
 * 验证四级标题、内容定位身份及隐藏期间的最新文字恢复。
 *
 * 通过正式FAB确认标题不依赖Text或另一份查看状态。
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
import { createState, For, Show } from '@/foundation'
import {
  Heading,
  KitMarkerStructureViewTrigger,
  type HeadingProps,
  type HeadingController,
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

describe('Heading', () => {
  test('组合与动态文字决定id，保留两类ref并在退出后停止同步', async () => {
    const visible = createState(true),
      hasContent = createState(true),
      content = createState('内容')
    let element!: HTMLHeadingElement, controller: HeadingController | undefined
    let domReceives = 0,
      controllerReceives = 0,
      domCleanups = 0,
      controllerCleanups = 0
    const host = document.body.appendChild(document.createElement('main'))
    dispose = render(
      () => (
        <Show when={visible.read()}>
          <Heading
            level={2}
            ref={(value) => {
              controller = value
              controllerReceives++
              return () => {
                controllerCleanups++
              }
            }}
            domRef={(value) => {
              element = value
              domReceives++
              return () => {
                domCleanups++
              }
            }}
          >
            <Show when={hasContent.read()}>
              <strong>组合 </strong>
              <span>{content.read()}</span>
            </Show>
          </Heading>
        </Show>
      ),
      host,
    )
    await expect.poll(() => element.id).toBe('组合 内容')
    expect(controller).toBeDefined()
    expect(controller).not.toBe(element)
    expect(controllerReceives).toBe(1)
    expect(domReceives).toBe(1)
    const hash = location.hash
    element.click()
    expect(location.hash).toBe(hash)
    expect(element.closest('a')).toBeNull()
    content.set('中文 / #空格')
    flush()
    await expect.poll(() => element.id).toBe('组合 中文 / #空格')
    element.querySelector('span')!.firstChild!.textContent = '子节点更新'
    await expect.poll(() => element.id).toBe('组合 子节点更新')
    hasContent.set(false)
    flush()
    await expect.poll(() => element.id).toBe('')
    visible.set(false)
    flush()
    expect(domCleanups).toBe(1)
    expect(controllerCleanups).toBe(1)
    element.textContent = '退出后的文字'
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(element.id).toBe('')
  })

  test('四级标题有递减的上下留白并允许调用方覆盖', () => {
    const levels: HeadingProps['level'][] = [1, 2, 3, 4]
    const host = document.body.appendChild(document.createElement('main'))
    dispose = render(
      () => (
        <>
          <For each={levels}>
            {(level) => (
              <section>
                <p>标题前内容</p>
                <Heading level={level}>分级标题</Heading>
                <p>标题后内容</p>
              </section>
            )}
          </For>
          <Heading
            level={2}
            style={{ 'margin-block-start': '7px', 'margin-block-end': '9px' }}
          >
            调用方留白
          </Heading>
        </>
      ),
      host,
    )

    const headings = [...host.querySelectorAll<HTMLElement>('section .Heading')]
    let previousStart = Infinity,
      previousEnd = Infinity
    for (const heading of headings) {
      const computed = getComputedStyle(heading)
      const start = parseFloat(computed.marginBlockStart),
        end = parseFloat(computed.marginBlockEnd)
      expect(start).toBeGreaterThan(0)
      expect(end).toBeGreaterThan(0)
      expect(start).toBeLessThan(previousStart)
      expect(end).toBeLessThan(previousEnd)
      const rect = heading.getBoundingClientRect()
      expect(
        rect.top -
          heading.previousElementSibling!.getBoundingClientRect().bottom,
      ).toBeGreaterThan(0)
      expect(
        heading.nextElementSibling!.getBoundingClientRect().top - rect.bottom,
      ).toBeGreaterThan(0)
      previousStart = start
      previousEnd = end
    }
    const overridden = getComputedStyle(
      host.querySelector<HTMLElement>(':scope > .Heading')!,
    )
    expect(overridden.marginBlockStart).toBe('7px')
    expect(overridden.marginBlockEnd).toBe('9px')
  })

  test('明确四种标题等级，定位框只保留Heading身份并恢复最新内容', async () => {
    expectTypeOf<{ children: string }>().not.toExtend<HeadingProps>()
    expectTypeOf<{ level: 5 }>().not.toExtend<HeadingProps>()
    expectTypeOf<{ level: 6 }>().not.toExtend<HeadingProps>()
    expectTypeOf<'as'>().not.toExtend<keyof HeadingProps>()
    expectTypeOf<'id'>().not.toExtend<keyof HeadingProps>()
    const content = createState('标题原文')
    const description = createState<string | undefined>()
    const display = createState<boolean | undefined>()
    const levels: HeadingProps['level'][] = [1, 2, 3, 4]
    const host = document.body.appendChild(document.createElement('main'))
    dispose = render(
      () => (
        <>
          <For each={levels}>
            {(level) => (
              <Heading
                level={level}
                description={level === 2 ? description : undefined}
                descriptionDisplay={display.read()}
              >
                {content}
              </Heading>
            )}
          </For>
          <KitMarkerStructureViewTrigger />
        </>
      ),
      host,
    )
    const headings = [...host.querySelectorAll<HTMLElement>('.Heading')]
    expect(headings.map((element) => element.tagName)).toEqual([
      'H1',
      'H2',
      'H3',
      'H4',
    ])
    expect(host.querySelector('.Text')).toBeNull()
    expect(
      headings.every(
        (element) => getComputedStyle(element).visibility === 'visible',
      ),
    ).toBe(true)
    const before = headings.map((element) =>
      element.getBoundingClientRect().toJSON(),
    )
    const control = host.querySelector<HTMLButtonElement>(
      '.ComponentMarkerStructureViewTrigger',
    )!
    control.click()
    flush()
    await expect
      .poll(
        () =>
          [...document.querySelectorAll('.StructureViewOverlay .label')].filter(
            (element) => element.textContent === 'Heading',
          ).length,
      )
      .toBe(4)
    expect(
      headings.every(
        (element) => getComputedStyle(element).visibility === 'hidden',
      ),
    ).toBe(true)
    expect(
      headings.map((element) => element.getBoundingClientRect().toJSON()),
    ).toEqual(before)
    description.set('页面标题')
    content.set('更新后的标题')
    flush()
    await expect
      .poll(() =>
        [...document.querySelectorAll('.StructureViewOverlay .label')].map(
          (element) => element.textContent,
        ),
      )
      .toContain('页面标题')
    expect(
      headings.every((element) => element.textContent === '更新后的标题'),
    ).toBe(true)
    await expect
      .poll(() => headings.every((element) => element.id === '更新后的标题'))
      .toBe(true)
    display.set(false)
    flush()
    await expect
      .poll(() =>
        headings.every((element) => getComputedStyle(element).opacity === '0'),
      )
      .toBe(true)
    await expect
      .poll(
        () => document.querySelectorAll('.StructureViewOverlay .label').length,
      )
      .toBe(0)
    display.set(undefined)
    flush()
    await expect
      .poll(
        () => document.querySelectorAll('.StructureViewOverlay .label').length,
      )
      .toBe(4)
    expect(
      [...document.querySelectorAll('.StructureViewOverlay .label')].some(
        (element) => element.textContent?.startsWith('Text'),
      ),
    ).toBe(false)
    const updated = headings.map((element) =>
      element.getBoundingClientRect().toJSON(),
    )
    control.click()
    flush()
    expect([...host.querySelectorAll('.Heading')]).toEqual(headings)
    expect(
      headings.every(
        (element) => getComputedStyle(element).visibility === 'visible',
      ),
    ).toBe(true)
    expect(
      headings.map((element) => element.getBoundingClientRect().toJSON()),
    ).toEqual(updated)
    expect(
      headings.every((element) => element.textContent === '更新后的标题'),
    ).toBe(true)
  })
})
