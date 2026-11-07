// @vitest-environment jsdom
import { flush } from 'solid-js'
import { render } from '@solidjs/web'
import { afterEach, expect, test, vi } from 'vitest'
import { createState, onCleanup, val } from '@/foundation'
import { Piv } from '../Piv'
import { createToggle } from '@/hooks'
import { defineInactivePlugin } from '../../plugins/tools/defineInactivePlugin'
import {
  createInternalDrag,
  findInternalDropTarget,
} from '../../plugins/kits/dragSession'
import { draggable } from '../../plugins/kits/dragAndDrop/draggable/draggable'
import { droppable } from '../../plugins/kits/dragAndDrop/droppable/droppable'

let dispose: (() => void) | undefined
afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

test('draggable 随 is 动态接入与移除，节点身份保持', () => {
  const host = document.body.appendChild(document.createElement('div'))
  const enabled = createState(false)
  dispose = render(() => {
    const capability = draggable({ payload: undefined })
    return <Piv is={val(enabled) ? capability : []} />
  }, host)
  const element = host.firstElementChild as HTMLElement
  expect(element.hasAttribute('data-plugin')).toBe(false)

  enabled.set(true)
  flush()
  expect(element.getAttribute('data-plugin')).toBe('draggable')
  expect(host.firstElementChild).toBe(element)

  enabled.set(false)
  flush()
  expect(element.hasAttribute('data-plugin')).toBe(false)
  expect(host.firstElementChild).toBe(element)
})

test('droppable 随 is 动态登记与注销内部接收目标', () => {
  const host = document.body.appendChild(document.createElement('div'))
  const enabled = createState(false)
  dispose = render(() => {
    const capability = droppable()
    return <Piv is={val(enabled) ? capability : []} />
  }, host)
  const element = host.firstElementChild as HTMLElement
  const dragSource = document.body.appendChild(document.createElement('div'))
  const drag = createInternalDrag(dragSource, 'item')
  const pointer = new PointerEvent('pointermove', { clientX: 1, clientY: 1 })

  ;(
    document as unknown as { elementsFromPoint: () => Element[] }
  ).elementsFromPoint = () => [element]
  try {
    expect(findInternalDropTarget(drag, pointer)).toBeUndefined()
    enabled.set(true)
    flush()
    expect(findInternalDropTarget(drag, pointer)?.target.target).toBe(element)
    enabled.set(false)
    flush()
    expect(findInternalDropTarget(drag, pointer)).toBeUndefined()
    expect(element.hasAttribute('data-plugin')).toBe(false)
  } finally {
    delete (document as unknown as { elementsFromPoint?: () => Element[] })
      .elementsFromPoint
  }
})

test('同一能力结果可交给多个节点，各节点接入自己的元素并在卸载时释放', () => {
  const host = document.body.appendChild(document.createElement('div'))
  const attached: HTMLElement[] = []
  const detached: HTMLElement[] = []
  const innerCleaned: HTMLElement[] = []
  dispose = render(() => {
    const capability = defineInactivePlugin({
      name: 'sharedResult',
      pluginCore({ addProps }) {
        addProps({
          domRef: (el) => {
            attached.push(el)
            onCleanup(() => innerCleaned.push(el))
            return () => detached.push(el)
          },
        })
        return {}
      },
    })()
    return (
      <>
        <Piv is={capability} htmlProps={{ 'data-testid': 'first' }} />
        <Piv is={capability} htmlProps={{ 'data-testid': 'second' }} />
      </>
    )
  }, host)
  const [first, second] = [...host.children] as HTMLElement[]
  expect(attached).toEqual([first, second])
  expect(first).not.toBe(second)
  dispose()
  dispose = undefined
  expect(innerCleaned).toEqual([first, second])
  expect(detached).toEqual([first, second])
})

test('两次构建的 Controller 状态独立，节点接入各自元素', () => {
  const host = document.body.appendChild(document.createElement('div'))
  const attached: HTMLElement[] = []
  const build = () =>
    defineInactivePlugin({
      name: 'independent',
      pluginCore({ addProps }) {
        const [hovered, control] = createToggle(false)
        addProps({
          domRef: (el) => {
            attached.push(el)
          },
        })
        return { hovered, toggle: control.toggle }
      },
    })()
  let first!: ReturnType<typeof build>['controller']
  let second!: ReturnType<typeof build>['controller']
  dispose = render(() => {
    const firstCapability = build()
    const secondCapability = build()
    first = firstCapability.controller
    second = secondCapability.controller
    return (
      <>
        <Piv is={firstCapability} htmlProps={{ 'data-testid': 'first' }} />
        <Piv is={secondCapability} htmlProps={{ 'data-testid': 'second' }} />
      </>
    )
  }, host)
  const firstElement = host.querySelector<HTMLElement>('[data-testid="first"]')!
  const secondElement = host.querySelector<HTMLElement>(
    '[data-testid="second"]',
  )!
  expect(attached).toEqual([firstElement, secondElement])
  expect(val(first.hovered)).toBe(false)
  expect(val(second.hovered)).toBe(false)
  first.toggle()
  flush()
  expect(val(first.hovered)).toBe(true)
  expect(val(second.hovered)).toBe(false)
})

test('能力结果中的 controller 不进入节点属性合并', () => {
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => {
    const capability = draggable({ payload: 'shared' })
    return <Piv is={capability} />
  }, host)
  const element = host.firstElementChild as HTMLElement
  expect(element.hasAttribute('controller')).toBe(false)
  expect(element.getAttribute('data-plugin')).toBe('draggable')
})

test('动态 is 按声明接入和释放，重复引用各执行一次，旁读更新不重接', () => {
  const host = document.body.appendChild(document.createElement('div'))
  const enabled = createState(true)
  const incidental = createState(0)
  const events: string[] = []
  let builds = 0
  dispose = render(() => {
    const capability = defineInactivePlugin({
      name: 'dynamic',
      pluginCore({ addProps }) {
        builds++
        addProps({
          domRef: () => {
            events.push(`接入${val(incidental)}`)
            onCleanup(() => events.push('内部清理'))
            return () => events.push('清理')
          },
        })
        return {}
      },
    })()
    const declaration = {
      get is() {
        return val(enabled) ? [capability, capability] : []
      },
    }
    return <Piv shadowProps={declaration} />
  }, host)
  expect(events).toEqual(['接入0', '接入0'])
  incidental.set(1)
  flush()
  expect(events).toHaveLength(2)
  enabled.set(false)
  flush()
  expect(events.filter((event) => event === '清理')).toHaveLength(2)
  expect(events.filter((event) => event === '内部清理')).toHaveLength(2)
  enabled.set(true)
  flush()
  expect(events.filter((event) => event === '接入1')).toHaveLength(2)
  expect(builds).toBe(1)
  dispose()
  dispose = undefined
  expect(events.filter((event) => event === '清理')).toHaveLength(4)
  expect(events.filter((event) => event === '内部清理')).toHaveLength(4)
})

test('直接 is 与 Plugin 提交的嵌套 is 随来源变化', () => {
  const host = document.body.appendChild(document.createElement('div'))
  const enabled = createState(true)
  dispose = render(() => {
    const child = defineInactivePlugin({
      name: 'child',
      pluginCore({ addProps }) {
        addProps({ htmlProps: { title: '已接入' } })
        return {}
      },
    })()
    const parent = defineInactivePlugin({
      name: 'parent',
      pluginCore({ addProps }) {
        addProps({
          get is() {
            return val(enabled) ? child : []
          },
        })
        return {}
      },
    })()
    return (
      <>
        <Piv is={val(enabled) ? child : []} />
        <Piv is={parent} />
      </>
    )
  }, host)
  const titles = () =>
    [...host.children].map((element) => element.getAttribute('title'))
  expect(titles()).toEqual(['已接入', '已接入'])
  enabled.set(false)
  flush()
  expect(titles()).toEqual(['', ''])
  enabled.set(true)
  flush()
  expect(titles()).toEqual(['已接入', '已接入'])
})
