import { flush } from 'solid-js'
// @vitest-environment jsdom

import { render } from '@solidjs/web'
import { afterEach, describe, expect, test } from 'vitest'
import { createState, val } from '@/foundation'
import { Input, type InputController } from './Input'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

describe('Input', () => {
  test('组件顶层读取最终有效性，props干预输入并继续跟随上游', () => {
    const invalid = createState(false)
    const host = document.body.appendChild(document.createElement('div'))
    let controller!: InputController
    dispose = render(() => <Input invalid={invalid} ref={current => { controller = current }} />, host)
    const input = host.querySelector('input')!
    expect(val(controller.invalid)).toBe(false)

    controller.props.invalid.set(true)
    flush()
    expect(val(invalid)).toBe(false)
    expect(val(controller.invalid)).toBe(true)
    expect(input.getAttribute('aria-invalid')).toBe('true')

    controller.setStatus('invalid', false)
    flush()
    expect(val(controller.invalid)).toBe(true)
    expect(input.getAttribute('aria-invalid')).toBe('true')

    invalid.set(true)
    flush()
    invalid.set(false)
    flush()
    expect(val(controller.invalid)).toBe(false)
    expect(input.hasAttribute('data-status')).toBe(false)
    expect(input.hasAttribute('aria-invalid')).toBe(false)
  })

  test('把最终无效状态输出为 data-status 和 aria-invalid', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Input invalid />, host)
    const input = host.firstElementChild as HTMLInputElement

    expect(input.getAttribute('data-status')).toBe('invalid')
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  test('validIf 的变化持续更新最终无效状态', () => {
    const validIf = createState(false)
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Input validIf={validIf} />, host)
    const input = host.firstElementChild as HTMLInputElement

    expect(input.getAttribute('data-status')).toBe('invalid')
    expect(input.getAttribute('aria-invalid')).toBe('true')

    validIf.set(true)
    flush()
    expect(input.hasAttribute('data-status')).toBe(false)
    expect(input.hasAttribute('aria-invalid')).toBe(false)
  })
})
