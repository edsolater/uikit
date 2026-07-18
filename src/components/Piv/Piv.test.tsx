// @vitest-environment jsdom

import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import { describe, expect, test } from 'vitest'
import { createState } from '../../hooks/createState'
import { Piv } from './Piv'

describe('Piv children', () => {
  test('动态文本来源更新后同步更新同一个 DOM 的文本', () => {
    const host = document.createElement('div')
    let setValue!: (value: number) => void

    function DynamicText() {
      const [value, updateValue] = createSignal(2)
      setValue = updateValue
      return <Piv>{value()}</Piv>
    }

    const dispose = render(() => <DynamicText />, host)

    expect(host.textContent).toBe('2')
    setValue(4)
    expect(host.textContent).toBe('4')

    dispose()
  })

  test('动态结构来源更新后替换元素内容', () => {
    const host = document.createElement('div')
    let setVisible!: (visible: boolean) => void

    function DynamicStructure() {
      const [visible, updateVisible] = createSignal(false)
      setVisible = updateVisible
      return <Piv>{visible() ? <span>已显示</span> : undefined}</Piv>
    }

    const dispose = render(() => <DynamicStructure />, host)

    expect(host.querySelector('span')).toBeNull()
    setVisible(true)
    expect(host.querySelector('span')?.textContent).toBe('已显示')

    dispose()
  })
})

describe('Piv Source 属性', () => {
  test('UIKit StateView 会同步更新 class 和 data attribute', () => {
    const host = document.createElement('div')
    const className = createState('before')
    const value = createState(2)
    const dispose = render(
      () => <Piv class={className} htmlProps={{ 'data-value': value }} />,
      host,
    )
    const element = host.firstElementChild!

    expect(element.className).toBe('before')
    expect(element.getAttribute('data-value')).toBe('2')

    className.set('after')
    value.set(4)

    expect(element.className).toBe('after')
    expect(element.getAttribute('data-value')).toBe('4')

    dispose()
  })

  test('Solid 动态 class 更新后移除旧 token 并写入新 token', () => {
    const host = document.createElement('div')
    let setValue!: (value: number) => void

    function DynamicClass() {
      const [value, updateValue] = createSignal(2)
      setValue = updateValue
      return <Piv class={`Tile value-${value()}`} />
    }

    const dispose = render(() => <DynamicClass />, host)
    const element = host.firstElementChild!

    expect(element.classList.contains('Tile')).toBe(true)
    expect(element.classList.contains('value-2')).toBe(true)

    setValue(4)

    expect(host.firstElementChild).toBe(element)
    expect(element.classList.contains('Tile')).toBe(true)
    expect(element.classList.contains('value-2')).toBe(false)
    expect(element.classList.contains('value-4')).toBe(true)

    dispose()
  })
})
