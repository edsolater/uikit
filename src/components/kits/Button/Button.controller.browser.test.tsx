/** 验证组件控制与 DOM 引用各自的生命周期，以及整体命令的状态效果。 */
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { createRef } from '@/hooks/createRef'
import { createDomRef } from '@/hooks/createDomRef'
import { createState, render, Show, val } from '@/foundation'
import { allButtons, Button, type ButtonController } from './Button'
import * as buttonStyle from './Button.style'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

test('组件引用控制状态，DOM 引用聚焦按钮，整体命令保留外部状态归属', () => {
  expect(allButtons.style).toBe(buttonStyle)
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

  button.setStatus?.('loading', true)
  flush()
  expect(first.getAttribute('aria-busy')).toBe('true')
  expect(second.getAttribute('aria-busy')).not.toBe('true')
  expect(val(button.loading)).toBe(true)

  const results = allButtons.setStatus('disabled', true)
  flush()
  expect(Array.from(results)).toEqual([undefined, undefined])
  expect(first.disabled).toBe(true)
  expect(second.disabled).toBe(false)
  expect(allButtons.loading.map((status) => val(status))).toEqual([true, false])
  expect(
    allButtons
      .hasStatus('disabled')
      .map((status) => val(status))
      .join(','),
  ).toBe('true,false')
  externallyDisabled.set(true)
  flush()
  allButtons.setStatus('disabled', false)
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
  allButtons.setStatus('loading', true)
  flush()
  expect(buttonElement.getAttribute?.('aria-busy')).toBe('true')

  visible.set(false)
  flush()
  expect(buttonElement.focus).toBeUndefined()
  expect(host.querySelector('button')).toBeNull()
  button.setStatus?.('disabled', true)
  allButtons.setStatus('loading', false)
  flush()
  expect(allButtons.hasStatus('loading').map((status) => val(status))).toEqual([
    false,
  ])

  visible.set(true)
  flush()
  expect(buttonElement.getAttribute?.('aria-busy')).not.toBe('true')
  expect(host.querySelector('button')!.disabled).toBe(true)

  mounted.set(false)
  flush()
  expect(button.setStatus).toBeUndefined()
  expect(buttonElement.focus).toBeUndefined()
  expect(allButtons.hasStatus('loading').length).toBe(0)

  allButtons.setStatus('loading', true)
  mounted.set(true)
  flush()
  expect(host.querySelector('button')!.getAttribute('aria-busy')).not.toBe(
    'true',
  )
})
