/** 验证组件 ref 的实例操作、整体命令和真实元素的有效期。 */
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { createRef } from '@/hooks/createRef'
import { createDomRef } from '@/hooks/createDomRef'
import { createState, render } from '@/foundation'
import { allButton, Button, type ButtonController } from './Button'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

test('组件引用控制状态，DOM 引用聚焦按钮，整体命令保留外部状态归属', () => {
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

  allButton.setStatus('disabled', true)
  flush()
  expect(first.disabled).toBe(true)
  expect(second.disabled).toBe(false)
  externallyDisabled.set(true)
  flush()
  allButton.setStatus('disabled', false)
  flush()
  expect(first.disabled).toBe(false)
  expect(second.disabled).toBe(true)
})

test('元素退出释放引用，整体命令不保留给之后接入的按钮', () => {
  const host = document.body.appendChild(document.createElement('div'))
  const visible = createState(true)
  const [button, receiveButton] = createRef<ButtonController>()
  const [buttonElement, receiveButtonElement] =
    createDomRef<HTMLButtonElement>()
  dispose = render(
    () => (
      <Button if={visible} ref={receiveButton} domRef={receiveButtonElement}>
        切换
      </Button>
    ),
    host,
  )
  allButton.setStatus('loading', true)
  flush()
  expect(buttonElement.getAttribute?.('aria-busy')).toBe('true')

  visible.set(false)
  flush()
  expect(button.setStatus).toBeUndefined()
  expect(buttonElement.focus).toBeUndefined()
  expect(host.querySelector('button')).toBeNull()
  allButton.setStatus('loading', false)

  visible.set(true)
  flush()
  expect(buttonElement.getAttribute?.('aria-busy')).toBe('true')
  dispose!()
  dispose = undefined
  flush()
  expect(button.setStatus).toBeUndefined()
  expect(buttonElement.focus).toBeUndefined()

  allButton.setStatus('loading', true)
  dispose = render(() => <Button>新建</Button>, host)
  expect(host.querySelector('button')!.getAttribute('aria-busy')).not.toBe(
    'true',
  )
})
