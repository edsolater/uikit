/** 验证组件控制与 DOM 引用各自的生命周期，以及整体命令的状态效果。 */
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { createRef } from '@/hooks/createRef'
import { createDomRef } from '@/hooks/createDomRef'
import { createState, render, Show, val } from '@/foundation'
import { Button, type ButtonController } from './Button'
import * as buttonStyle from './Button.style'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

test('组件引用控制状态，DOM 引用聚焦按钮，整体命令只包含主动接入的实例', () => {
  expect(Button.controllers.style).toBe(buttonStyle)
  const host = document.body.appendChild(document.createElement('div'))
  const [button, receiveButton] = createRef<ButtonController>()
  const [buttonElement, receiveButtonElement] =
    createDomRef<HTMLButtonElement>()
  const externallyDisabled = createState(false)
  dispose = render(
    () => (
      <>
        <Button ref={receiveButton} domRef={receiveButtonElement}>
          保存
        </Button>
        <Button disabled={externallyDisabled}>外部控制</Button>
      </>
    ),
    host,
  )
  const [first, second] = host.querySelectorAll('button')
  buttonElement.focus?.()
  expect(document.activeElement).toBe(first)
  buttonElement.title = '动作说明'
  expect(first.title).toBe('动作说明')

  button.loading?.set(true)
  flush()
  expect(first.getAttribute('aria-busy')).toBe('true')
  expect(second.getAttribute('aria-busy')).not.toBe('true')
  expect(val(button.loading)).toBe(true)

  const results = Button.controllers.disabled.set(true)
  flush()
  expect(Array.from(results)).toHaveLength(1)
  expect(first.disabled).toBe(true)
  expect(second.disabled).toBe(false)
  expect(Button.controllers.loading.map((status) => val(status))).toEqual([true])
  expect(
    Button.controllers
      .disabled
      .map((status) => val(status))
      .join(','),
  ).toBe('true')
  externallyDisabled.set(true)
  flush()
  Button.controllers.disabled.set(false)
  flush()
  expect(first.disabled).toBe(false)
  expect(second.disabled).toBe(true)
})

test('隐藏只释放 DOM 引用，组件销毁才退出整体控制，新实例不继承命令', () => {
  const host = document.body.appendChild(document.createElement('div'))
  const visible = createState(true)
  const mounted = createState(true)
  const [button, receiveButton] = createRef<ButtonController>()
  const [buttonElement, receiveButtonElement] =
    createDomRef<HTMLButtonElement>()
  dispose = render(
    () => (
      <Show when={val(mounted)}>
        <Button if={visible} ref={receiveButton} domRef={receiveButtonElement}>
          切换
        </Button>
      </Show>
    ),
    host,
  )
  Button.controllers.loading.set(true)
  flush()
  expect(buttonElement.getAttribute?.('aria-busy')).toBe('true')

  visible.set(false)
  flush()
  expect(buttonElement.focus).toBeUndefined()
  expect(host.querySelector('button')).toBeNull()
  button.disabled?.set(true)
  button.class?.set('隐藏期间的类名')
  Button.controllers.loading.set(false)
  flush()
  expect(Button.controllers.loading.map((status) => val(status))).toEqual([
    false,
  ])

  visible.set(true)
  flush()
  expect(buttonElement.getAttribute?.('aria-busy')).not.toBe('true')
  expect(host.querySelector('button')!.disabled).toBe(true)
  expect(host.querySelector('button')!.classList.contains('隐藏期间的类名')).toBe(true)

  mounted.set(false)
  flush()
  expect(button.loading).toBeUndefined()
  expect(buttonElement.focus).toBeUndefined()
  expect(Button.controllers.loading.length).toBe(0)

  Button.controllers.loading.set(true)
  mounted.set(true)
  flush()
  expect(host.querySelector('button')!.getAttribute('aria-busy')).not.toBe(
    'true',
  )
})

test('隐藏按钮仍在构建时报告原分类冲突，显示后消费同一分组来源', () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const host = document.body.appendChild(document.createElement('div'))
  const [button, receive] = createRef<ButtonController>()
  const visible = createState(false)
  const receiveExplicit = vi.fn()
  dispose = render(() => <>
    <Button if={visible} ref={receive} filled outlined>动作</Button>
    <Button if={visible} ref={receiveExplicit} appearance={undefined} filled outlined>显式组</Button>
  </>, host)
  expect(host.querySelector('button')).toBeNull()
  expect(warning).toHaveBeenCalledTimes(2)
  visible.set(true)
  flush()
  expect(host.querySelector('button')!.dataset.appearance).toBe('filled')
  expect(host.querySelectorAll('button')[1].dataset.appearance).toBe('outlined')
  expect(warning).toHaveBeenCalledTimes(2)
  button.filled?.set(false)
  flush()
  expect(host.querySelector('button')!.dataset.appearance).toBe('outlined')
  warning.mockRestore()
})

test('组件ref才启用控制层，单独domRef与undefined组件ref仍是普通按钮', () => {
  const host = document.body.appendChild(document.createElement('div'))
  const receive = vi.fn()
  dispose = render(() => <>
    <Button domRef={receive}>普通</Button>
    <Button {...{ ref: undefined }}>未接入</Button>
  </>, host)
  expect(receive).toHaveBeenCalledOnce()
  expect(host.querySelectorAll('button')).toHaveLength(2)
  expect(Array.from(Button.controllers)).toHaveLength(0)
})

test('缺省分类与状态可在运行时指令修改，确定描述词和回调复用原消费链', () => {
  const host = document.body.appendChild(document.createElement('div'))
  const [button, receive] = createRef<ButtonController>()
  const first = vi.fn()
  const next = vi.fn()
  dispose = render(() => <Button ref={receive} onClick={first}>动作</Button>, host)
  const element = host.querySelector('button')!
  expect(element.dataset.appearance).toBe('outlined')
  button.filled?.set(true)
  button.loading?.set(true)
  button.disabled?.set(true)
  button.size?.set('large')
  flush()
  expect(element.dataset.appearance).toBe('filled')
  expect(element.dataset.size).toBe('large')
  expect(element.disabled).toBe(true)
  expect(element.getAttribute('aria-busy')).toBe('true')
  button.appearance?.set(undefined)
  button.disabled?.set(false)
  button.onClick?.set(() => next)
  flush()
  expect(element.dataset.appearance).toBe('outlined')
  element.click()
  expect(first).not.toHaveBeenCalled()
  expect(next).toHaveBeenCalledOnce()
})

test('上游状态仍跟随原Source，ref只能由Prop换接并释放接收器', () => {
  const host = document.body.appendChild(document.createElement('div'))
  const external = createState(false)
  const cleanupFirst = vi.fn()
  const cleanupNext = vi.fn()
  const first = vi.fn((_controller: ButtonController) => cleanupFirst)
  const next = vi.fn((_controller: ButtonController) => cleanupNext)
  const receive = createState(() => first)
  let controller!: ButtonController
  const props = { disabled: external, get ref() { return val(receive) } }
  dispose = render(() => <Button {...props}>动作</Button>, host)
  controller = first.mock.calls[0][0]
  expect('ref' in controller).toBe(false)
  expect(Reflect.get(controller, 'ref')).toBeUndefined()
  controller.disabled.set(true)
  flush()
  expect(host.querySelector('button')!.disabled).toBe(true)
  external.set(true)
  flush()
  external.set(false)
  receive.set(() => next)
  flush()
  expect(host.querySelector('button')!.disabled).toBe(false)
  expect(cleanupFirst).toHaveBeenCalledOnce()
  expect(next).toHaveBeenCalledWith(controller)
  dispose()
  dispose = undefined
  expect(cleanupNext).toHaveBeenCalledOnce()
  expect(Array.from(Button.controllers)).toHaveLength(0)
})

test('原未声明的内容和DOM响应字段通过同一Props链更新', () => {
  const host = document.body.appendChild(document.createElement('div'))
  const [button, receive] = createRef<ButtonController>()
  dispose = render(() => <Button ref={receive} />, host)
  const element = host.querySelector('button')!
  button.class?.set('运行时类名')
  button.id?.set('runtime-button')
  button.htmlProps?.set({ title: '运行时标题', 'data-probe': '完成' })
  button.name?.set('运行时动作')
  button.children?.set('运行时内容')
  flush()
  expect(element.classList.contains('运行时类名')).toBe(true)
  expect(element.id).toBe('runtime-button')
  expect(element.title).toBe('运行时标题')
  expect(element.dataset.probe).toBe('完成')
  expect(element.getAttribute('aria-label')).toBe('运行时动作')
  expect(element.textContent).toBe('运行时内容')
  button.draggable?.set(true)
  const onDrop = vi.fn()
  button.droppable?.set({ onDrop })
  flush()
  Object.assign(element, {
    setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => true,
  })
  element.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true, isPrimary: true, pointerId: 4, button: 0,
  }))
  expect(element.getAttribute('data-interacting')).toBe('true')
  window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 4 }))
  const transfer = new DataTransfer()
  transfer.items.add(new File(['内容'], 'probe.txt'))
  const drop = () => {
    for (const type of ['dragenter', 'drop']) element.dispatchEvent(new DragEvent(type, {
      bubbles: true, cancelable: true, dataTransfer: transfer,
    }))
  }
  drop()
  expect(onDrop).toHaveBeenCalledOnce()
  button.draggable?.set(false)
  button.droppable?.set(false)
  flush()
  expect(element.getAttribute('data-interacting')).not.toBe('true')
  drop()
  expect(onDrop).toHaveBeenCalledOnce()
})
