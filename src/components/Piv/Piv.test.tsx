// @vitest-environment jsdom

import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import { describe, expect, test } from 'vitest'
import { createState } from '../../hooks/createState'
import { Piv } from './Piv'
import { createPivPlugin } from './plugin/helpers'

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

  test('嵌套 plugin、shadowProps 与直接动态 class 统一进入 class 消费层', () => {
    const host = document.createElement('div')
    let setValue!: (value: number) => void
    const nestedPlugin = createPivPlugin(() => ({ class: 'from-nested-plugin' }))
    const plugin = createPivPlugin(() => ({
      class: 'from-plugin',
      plugins: nestedPlugin,
    }))

    function LayeredClass() {
      const [value, updateValue] = createSignal(2)
      setValue = updateValue
      return (
        <Piv
          plugins={plugin}
          shadowProps={{ class: 'from-shadow-props' }}
          class={`direct-${value()}`}
        />
      )
    }

    const dispose = render(() => <LayeredClass />, host)
    const element = host.firstElementChild!

    expect(element.classList.contains('from-plugin')).toBe(true)
    expect(element.classList.contains('from-nested-plugin')).toBe(true)
    expect(element.classList.contains('from-shadow-props')).toBe(true)
    expect(element.classList.contains('direct-2')).toBe(true)

    setValue(4)

    expect(host.firstElementChild).toBe(element)
    expect(element.classList.contains('direct-2')).toBe(false)
    expect(element.classList.contains('direct-4')).toBe(true)

    dispose()
  })
})

describe('Piv style 属性', () => {
  test('Solid 动态 style 与字段 StateView 都会更新同一个 DOM', () => {
    const host = document.createElement('div')
    const backgroundColor = createState('black')
    let setColor!: (value: string) => void

    function DynamicStyle() {
      const [color, updateColor] = createSignal('red')
      setColor = updateColor
      return <Piv style={{ color: color(), 'background-color': backgroundColor }} />
    }

    const dispose = render(() => <DynamicStyle />, host)
    const element = host.firstElementChild as HTMLElement

    expect(element.style.color).toBe('red')
    expect(element.style.backgroundColor).toBe('black')

    setColor('blue')
    backgroundColor.set('white')

    expect(host.firstElementChild).toBe(element)
    expect(element.style.color).toBe('blue')
    expect(element.style.backgroundColor).toBe('white')

    dispose()
  })

  test('plugin 与直接 props 各自提供 StateView 列表时仍按字段优先级合并', () => {
    const host = document.createElement('div')
    const pluginStyles = createState([{ color: 'green', 'background-color': 'black' }])
    const directStyles = createState<Array<{ color?: string; 'border-color'?: string }>>([
      { color: 'red' },
    ])
    const plugin = createPivPlugin(() => ({ style: pluginStyles }))
    const dispose = render(
      () => <Piv plugins={plugin} style={directStyles} />,
      host,
    )
    const element = host.firstElementChild as HTMLElement

    expect(element.style.color).toBe('red')
    expect(element.style.backgroundColor).toBe('black')

    directStyles.set([{ 'border-color': 'blue' }])

    expect(element.style.color).toBe('green')
    expect(element.style.backgroundColor).toBe('black')
    expect(element.style.borderColor).toBe('blue')

    dispose()
  })
})

describe('Piv htmlProps 属性', () => {
  test('Solid 动态 htmlProps 更新时会清除旧字段并写入新字段', () => {
    const host = document.createElement('div')
    let setActive!: (active: boolean) => void

    function DynamicHTMLProps() {
      const [active, updateActive] = createSignal(false)
      setActive = updateActive
      return (
        <Piv
          htmlProps={active()
            ? { 'data-active': 'yes' }
            : { 'data-id': 'base' }}
        />
      )
    }

    const dispose = render(() => <DynamicHTMLProps />, host)
    const element = host.firstElementChild!

    expect(element.getAttribute('data-id')).toBe('base')
    expect(element.hasAttribute('data-active')).toBe(false)

    setActive(true)

    expect(host.firstElementChild).toBe(element)
    expect(element.hasAttribute('data-id')).toBe(false)
    expect(element.getAttribute('data-active')).toBe('yes')

    dispose()
  })

  test('直接 htmlProps 接管同名字段后不再订阅低优先级来源', () => {
    const host = document.createElement('div')
    const pluginValue = createState('plugin-before')
    const directValue = createState('direct-before')
    let pluginValueReadCount = 0
    const plugin = createPivPlugin(() => ({
      htmlProps: {
        get 'data-value'() {
          pluginValueReadCount += 1
          return pluginValue
        },
      },
    }))
    const dispose = render(
      () => <Piv plugins={plugin} htmlProps={{ 'data-value': directValue }} />,
      host,
    )
    const element = host.firstElementChild!

    expect(element.getAttribute('data-value')).toBe('direct-before')
    expect(pluginValueReadCount).toBe(0)

    pluginValue.set('plugin-after')
    expect(element.getAttribute('data-value')).toBe('direct-before')
    expect(pluginValueReadCount).toBe(0)

    directValue.set('direct-after')
    expect(element.getAttribute('data-value')).toBe('direct-after')

    dispose()
  })

  test('动态 property 声明消失时恢复 DOM 初始值', () => {
    const host = document.createElement('div')
    let setActive!: (active: boolean) => void

    function DynamicInputProps() {
      const [active, updateActive] = createSignal(true)
      setActive = updateActive
      return (
        <Piv
          as="input"
          htmlProps={active() ? { value: '已填写', checked: true } : {}}
        />
      )
    }

    const dispose = render(() => <DynamicInputProps />, host)
    const element = host.firstElementChild as HTMLInputElement

    expect(element.value).toBe('已填写')
    expect(element.checked).toBe(true)

    setActive(false)

    expect(element.value).toBe('')
    expect(element.checked).toBe(false)

    dispose()
  })
})
