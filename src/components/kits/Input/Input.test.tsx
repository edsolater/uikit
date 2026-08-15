// @vitest-environment jsdom

import { render } from 'solid-js/web'
import { afterEach, describe, expect, test } from 'vitest'
import { createState } from '../../../hooks'
import { Input } from './Input'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

describe('Input', () => {
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
    expect(input.hasAttribute('data-status')).toBe(false)
    expect(input.hasAttribute('aria-invalid')).toBe(false)
  })
})
