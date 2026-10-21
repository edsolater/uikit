import { flush } from 'solid-js'
import { render } from '@solidjs/web'
import { afterEach, expect, test, vi } from 'vitest'
import { createState, val } from '@/foundation'
import { Piv } from '../Piv'
import { createInternalDrag, findInternalDropTarget } from '../../plugins/kits/dragAndDrop'
import { createToggle } from '@/hooks/value-state/toggle'
import { mergeProps } from '@/foundation/render'
import { Button } from '../../kits/Button/Button'

vi.mock('@/hooks/value-state/toggle', { spy: true })

let dispose: (() => void) | undefined
afterEach(() => {
  dispose?.()
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

test('缺省与字面 false 不创建拖放监听，false 覆盖低层快捷字段', () => {
  vi.mocked(createToggle).mockClear()
  const listen = vi.spyOn(HTMLElement.prototype, 'addEventListener')
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => <>
    <Piv />
    <Piv draggable={false} droppable={false} />
    <Piv draggable={false} shadowProps={{ draggable: true }} />
  </>, host)
  expect(host.childElementCount).toBe(3)
  expect(listen.mock.calls.filter(([event]) => ['pointerdown', 'dragstart', 'dragenter', 'dragover', 'drop'].includes(event))).toHaveLength(0)
  expect(host.querySelector('[data-plugin]')).toBeNull()
  expect(createToggle).not.toHaveBeenCalled()
})

test('真实快捷入口的 options 未变时不重建插件或中断拖动', () => {
  const incidental = createState(0)
  const options = { payload: 'stable' }
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => <Piv draggable={(val(incidental), options)} />, host)
  const element = host.firstElementChild as HTMLElement
  Object.assign(element, { setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => true })
  element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9, isPrimary: true, button: 0 }))
  expect(element.getAttribute('data-interacting')).toBe('true')
  const instanceStateCount = vi.mocked(createToggle).mock.calls.length
  incidental.set(1)
  flush()
  expect(element.getAttribute('data-interacting')).toBe('true')
  expect(vi.mocked(createToggle).mock.calls.length).toBe(instanceStateCount)
  window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 9 }))
})

test('配置 disabled 沿原插件契约创建，普通 ref 读取已提交的能力字段', () => {
  const host = document.body.appendChild(document.createElement('div'))
  let initialDraggable: boolean | undefined
  dispose = render(() => <Piv draggable={{ payload: 'item', disabled: true }} ref={element => { initialDraggable = element.draggable }} />, host)
  expect(initialDraggable).toBe(false)
  expect((host.firstElementChild as HTMLElement).getAttribute('data-plugin')).toBe('draggable')
})

test('公共开关不重置未变化的 once 事件与注册级清理', () => {
  const enabled = createState(false)
  const callback = vi.fn()
  const cleanup = vi.fn()
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => <Piv draggable={enabled} on={{ click: { once: true, callback }, mouseenter: { callback() {}, cleanup } }} />, host)
  const element = host.firstElementChild as HTMLElement
  element.click()
  enabled.set(true)
  flush()
  enabled.set(false)
  flush()
  element.click()
  expect(callback).toHaveBeenCalledTimes(1)
  expect(cleanup).not.toHaveBeenCalled()
  dispose()
  dispose = undefined
  expect(cleanup).toHaveBeenCalledTimes(1)
})

test('两种公共能力同元素共存，drop 关闭注销并可重新接收外部文件', () => {
  const enabled = createState(true)
  const onDrop = vi.fn()
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => <Piv draggable droppable={val(enabled) ? { onDrop } : false} />, host)
  const element = host.firstElementChild as HTMLElement
  const source = document.body.appendChild(document.createElement('div'))
  vi.spyOn(document, 'elementsFromPoint').mockReturnValue([element])
  const drag = createInternalDrag(source, 'item')
  const pointer = new PointerEvent('pointermove', { clientX: 10, clientY: 10 })
  expect(findInternalDropTarget(drag, pointer)?.target.element).toBe(element)
  const transfer = new DataTransfer()
  transfer.items.add(new File(['item'], 'item.txt'))
  const drop = () => {
    element.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: transfer }))
    element.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }))
  }
  expect(element.getAttribute('data-plugin')).toContain('draggable')
  Object.assign(element, { setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => true })
  element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 3, isPrimary: true, button: 0 }))
  expect(element.getAttribute('data-interacting')).toBe('true')
  window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 3 }))
  expect(element.hasAttribute('data-interacting')).toBe(false)
  drop()
  expect(onDrop).toHaveBeenCalledTimes(1)
  enabled.set(false)
  flush()
  expect(findInternalDropTarget(drag, pointer)).toBeUndefined()
  drop()
  expect(onDrop).toHaveBeenCalledTimes(1)
  enabled.set(true)
  flush()
  expect(findInternalDropTarget(drag, pointer)?.target.element).toBe(element)
  drop()
  expect(onDrop).toHaveBeenCalledTimes(2)
  expect(host.firstElementChild).toBe(element)
})

test('快捷来源整体换源后退出旧订阅，undefined 回落而 false 覆盖', () => {
  const first = createState<boolean | undefined>(undefined)
  const second = createState<boolean | undefined>(true)
  const selected = createState(first)
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => <Piv draggable={val(selected)} shadowProps={{ draggable: true }} />, host)
  const element = host.firstElementChild as HTMLElement
  expect(element.getAttribute('data-plugin')).toBe('draggable')
  first.set(false)
  flush()
  expect(element.hasAttribute('data-plugin')).toBe(false)
  selected.set(second)
  flush()
  expect(element.getAttribute('data-plugin')).toBe('draggable')
  first.set(true)
  flush()
  second.set(false)
  flush()
  expect(element.hasAttribute('data-plugin')).toBe(false)
  first.set(undefined)
  flush()
  expect(element.hasAttribute('data-plugin')).toBe(false)
})

test('合并代理与 Button 透传的初始 false getter 仍能启用', () => {
  const enabled = createState(false)
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => {
    const props = mergeProps({ get draggable() { return val(enabled) } })
    return <><Piv {...props} /><Button draggable={val(enabled)}>拖动</Button></>
  }, host)
  expect(host.querySelectorAll('[data-plugin="draggable"]')).toHaveLength(0)
  enabled.set(true)
  flush()
  const elements = Array.from(host.children) as HTMLElement[]
  for (const element of elements) {
    Object.assign(element, { setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => true })
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, isPrimary: true, pointerId: 4, button: 0 }))
    expect(element.getAttribute('data-interacting')).toBe('true')
    window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 4 }))
  }
  enabled.set(false)
  flush()
  expect(host.querySelectorAll('[data-plugin="draggable"]')).toHaveLength(0)
})

test('if 隐藏释放能力，重建后旧元素不会响应指针', () => {
  const visible = createState(true)
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => <Piv if={visible} draggable />, host)
  const oldElement = host.firstElementChild as HTMLElement
  const pointer = () => new PointerEvent('pointerdown', { bubbles: true, pointerId: 2, isPrimary: true, button: 0 })
  visible.set(false)
  flush()
  expect(host.childElementCount).toBe(0)
  oldElement.dispatchEvent(pointer())
  expect(oldElement.hasAttribute('data-interacting')).toBe(false)
  visible.set(true)
  flush()
  const current = host.firstElementChild as HTMLElement
  expect(current).not.toBe(oldElement)
  Object.assign(current, { setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => true })
  current.dispatchEvent(pointer())
  expect(current.getAttribute('data-interacting')).toBe('true')
  dispose()
  dispose = undefined
  expect(current.hasAttribute('data-interacting')).toBe(false)
})

test('公共 draggable 从关闭开启并在关闭时取消原元素的拖动', () => {
  const enabled = createState(false)
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => <Piv draggable={val(enabled) ? { payload: 'item', activationDistance: 0 } : false} />, host)
  const element = host.firstElementChild as HTMLElement
  Object.assign(element, {
    setPointerCapture() {},
    releasePointerCapture() {},
    hasPointerCapture: () => true,
  })
  const start = () => element.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, clientX: 10, clientY: 10,
  }))
  start()
  expect(element.hasAttribute('data-interacting')).toBe(false)
  enabled.set(true)
  flush()
  start()
  expect(element.getAttribute('data-interacting')).toBe('true')
  enabled.set(false)
  flush()
  expect(element.hasAttribute('data-interacting')).toBe(false)
  expect(host.firstElementChild).toBe(element)
  expect(host.childElementCount).toBe(1)
})
