// @vitest-environment jsdom

import { render } from 'solid-js/web'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createState } from '../../../hooks'
import { Button } from './Button'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

describe('Button', () => {
  test('把自身的 onClick 动作翻译成底层 click 事件', () => {
    const host = document.body.appendChild(document.createElement('div'))
    const onClick = vi.fn()
    dispose = render(() => <Button onClick={onClick}>确认</Button>, host)
    const element = host.firstElementChild as HTMLButtonElement

    element.click()

    expect(onClick).toHaveBeenCalledOnce()
  })

  test('确定描述词直接形成各 Brand 分组的 DOM 描述', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Button small solid accent>保存</Button>, host)
    const element = host.firstElementChild as HTMLButtonElement

    expect(element.getAttribute('data-size')).toBe('small')
    expect(element.getAttribute('data-tone')).toBe('solid')
    expect(element.getAttribute('data-intent')).toBe('accent')
  })

  test('不定字段一旦声明便接管分组，undefined 不回落到确定描述词', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const size = createState<'small' | 'large' | 'xlarge' | undefined>()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Button small size={size}>保存</Button>, host)
    const element = host.firstElementChild as HTMLButtonElement

    expect(element.hasAttribute('data-size')).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('不定字段“size”'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('“size”接管整个分组'))

    size.set('large')
    expect(element.getAttribute('data-size')).toBe('large')
  })

  test('多个确定描述词只警告并按定义顺序产生稳定结果', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Button small large>保存</Button>, host)
    const element = host.firstElementChild as HTMLButtonElement

    expect(element.getAttribute('data-size')).toBe('small')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('“small”、“large”'))
  })

  test('确定描述词的响应式布尔值只改变它是否存在', () => {
    const small = createState(false)
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Button small={small}>保存</Button>, host)
    const element = host.firstElementChild as HTMLButtonElement

    expect(element.hasAttribute('data-size')).toBe(false)

    small.set(true)
    expect(element.getAttribute('data-size')).toBe('small')
  })

  test('多个 Status 同时成立，并由 effect 补充原生状态', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Button loading disabled>保存中</Button>, host)
    const element = host.firstElementChild as HTMLButtonElement

    expect(element.getAttribute('data-status')).toBe('loading disabled')
    expect(element.disabled).toBe(true)
    expect(element.getAttribute('aria-busy')).toBe('true')
  })

  test('外部 Status Source 的后续变化持续进入 effect 建立的声明', () => {
    const loading = createState(false)
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Button loading={loading}>保存</Button>, host)
    const element = host.firstElementChild as HTMLButtonElement

    expect(element.hasAttribute('data-status')).toBe(false)
    expect(element.hasAttribute('aria-busy')).toBe(false)

    loading.set(true)
    expect(element.getAttribute('data-status')).toBe('loading')
    expect(element.getAttribute('aria-busy')).toBe('true')
  })
})
