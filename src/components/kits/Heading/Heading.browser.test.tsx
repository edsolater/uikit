/**
 * Heading的真实浏览器行为验收。
 *
 * 验证六级原生标题、独立定位身份及隐藏期间的最新文字恢复。
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
import { createState, For } from '@/foundation'
import { Heading, StructureViewFab, type HeadingProps } from '@/components'
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
  test('明确六种标题等级，定位框只保留Heading身份并恢复最新内容', async () => {
    expectTypeOf<{ children: string }>().not.toExtend<HeadingProps>()
    expectTypeOf<{ level: 7 }>().not.toExtend<HeadingProps>()
    expectTypeOf<'as'>().not.toExtend<keyof HeadingProps>()
    const content = createState('标题原文')
    const description = createState<string | undefined>()
    const display = createState<boolean | undefined>()
    const levels: HeadingProps['level'][] = [1, 2, 3, 4, 5, 6]
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
          <StructureViewFab />
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
      'H5',
      'H6',
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
    const control = host.querySelector<HTMLButtonElement>('.StructureViewFab')!
    control.click()
    flush()
    await expect
      .poll(
        () =>
          [...document.querySelectorAll('.StructureViewOverlay .label')].filter(
            (element) => element.textContent === 'Heading',
          ).length,
      )
      .toBe(6)
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
      .toBe(6)
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
