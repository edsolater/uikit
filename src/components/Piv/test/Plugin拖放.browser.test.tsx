import { flush } from 'solid-js'
import { render } from '@solidjs/web'
import { afterEach, expect, test, vi } from 'vitest'
import { createState, val } from '@/foundation'
import { Piv } from '../Piv'
import { draggable } from '../../plugins/kits/dragAndDrop/draggable/draggable'
import { droppable } from '../../plugins/kits/dragAndDrop/droppable/droppable'
import {
  createInternalDrag,
  findInternalDropTarget,
} from '../../plugins/kits/dragSession'

let dispose: (() => void) | undefined
afterEach(() => {
  dispose?.()
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

test('is 的能力未变时不重建插件或中断拖动', () => {
  const incidental = createState(0)
  const options = { payload: 'stable' }
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => {
    const capability = draggable(options)
    return <Piv is={(val(incidental), capability)} />
  }, host)
  const element = host.firstElementChild as HTMLElement
  Object.assign(element, {
    setPointerCapture() {},
    releasePointerCapture() {},
    hasPointerCapture: () => true,
  })
  element.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      pointerId: 9,
      isPrimary: true,
      button: 0,
    }),
  )
  expect(element.getAttribute('data-interacting')).toBe('true')
  incidental.set(1)
  flush()
  expect(element.getAttribute('data-interacting')).toBe('true')
  window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 9 }))
})

test('配置 disabled 沿原插件契约创建，普通 domRef 读取已提交的能力字段', () => {
  const host = document.body.appendChild(document.createElement('div'))
  let initialDraggable: boolean | undefined
  dispose = render(() => {
    const capability = draggable({ payload: 'item', disabled: true })
    return (
      <Piv
        is={capability}
        domRef={(element) => {
          initialDraggable = element.draggable
        }}
      />
    )
  }, host)
  expect(initialDraggable).toBe(false)
  expect(
    (host.firstElementChild as HTMLElement).getAttribute('data-plugin'),
  ).toBe('draggable')
})

test('动态 is 不重置未变化的 once 事件与注册级清理', () => {
  const enabled = createState(false)
  const callback = vi.fn()
  const cleanup = vi.fn()
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => {
    const capability = draggable({ payload: undefined })
    return (
      <Piv
        is={val(enabled) ? capability : []}
        on={{
          click: { once: true, callback },
          mouseenter: { callback() {}, cleanup },
        }}
      />
    )
  }, host)
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

test('两种能力同元素共存，drop 关闭注销并可重新接收外部文件', () => {
  const enabled = createState(true)
  const onDrop = vi.fn()
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => {
    const drag = draggable({ payload: undefined })
    const drop = droppable({ onDrop })
    return <Piv is={val(enabled) ? [drag, drop] : [drag]} />
  }, host)
  const element = host.firstElementChild as HTMLElement
  const source = document.body.appendChild(document.createElement('div'))
  vi.spyOn(document, 'elementsFromPoint').mockReturnValue([element])
  const drag = createInternalDrag(source, 'item')
  const pointer = new PointerEvent('pointermove', { clientX: 10, clientY: 10 })
  expect(findInternalDropTarget(drag, pointer)?.target.element).toBe(element)
  const transfer = new DataTransfer()
  transfer.items.add(new File(['item'], 'item.txt'))
  const drop = () => {
    element.dispatchEvent(
      new DragEvent('dragenter', {
        bubbles: true,
        cancelable: true,
        dataTransfer: transfer,
      }),
    )
    element.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: transfer,
      }),
    )
  }
  expect(element.getAttribute('data-plugin')?.split(' ')).toContain('draggable')
  Object.assign(element, {
    setPointerCapture() {},
    releasePointerCapture() {},
    hasPointerCapture: () => true,
  })
  element.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      pointerId: 3,
      isPrimary: true,
      button: 0,
    }),
  )
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

test('if 隐藏释放能力，重建后旧元素不会响应指针', () => {
  const visible = createState(true)
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => {
    const capability = draggable({ payload: undefined })
    return <Piv if={visible} is={capability} />
  }, host)
  const oldElement = host.firstElementChild as HTMLElement
  const pointer = () =>
    new PointerEvent('pointerdown', {
      bubbles: true,
      pointerId: 2,
      isPrimary: true,
      button: 0,
    })
  visible.set(false)
  flush()
  expect(host.childElementCount).toBe(0)
  oldElement.dispatchEvent(pointer())
  expect(oldElement.hasAttribute('data-interacting')).toBe(false)
  visible.set(true)
  flush()
  const current = host.firstElementChild as HTMLElement
  expect(current).not.toBe(oldElement)
  Object.assign(current, {
    setPointerCapture() {},
    releasePointerCapture() {},
    hasPointerCapture: () => true,
  })
  current.dispatchEvent(pointer())
  expect(current.getAttribute('data-interacting')).toBe('true')
  dispose()
  dispose = undefined
  expect(current.hasAttribute('data-interacting')).toBe(false)
})

test('动态 is 中的 draggable 从关闭开启并在关闭时取消原元素的拖动', () => {
  const enabled = createState(false)
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => {
    const capability = draggable({ payload: 'item', activationDistance: 0 })
    return <Piv is={val(enabled) ? capability : []} />
  }, host)
  const element = host.firstElementChild as HTMLElement
  Object.assign(element, {
    setPointerCapture() {},
    releasePointerCapture() {},
    hasPointerCapture: () => true,
  })
  const start = () =>
    element.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
        button: 0,
        clientX: 10,
        clientY: 10,
      }),
    )
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
