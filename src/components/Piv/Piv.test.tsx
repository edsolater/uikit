import { flush } from 'solid-js'
// @vitest-environment jsdom

import { createRoot, createSignal } from 'solid-js'
import { render } from '@solidjs/web'
import { describe, expect, test } from 'vitest'
import { createContext, createState, isStateView, onCleanup, onMount, useContext, val } from '@/foundation'
import { Piv } from './Piv'
import { createPivPlugin } from './plugin/helpers'
import { mergePivProps } from './plugin/handlePivPlugin'

describe('Piv 生命周期', () => {

  test('option 随当前值更新选中项并发布 change，表头原生语义随状态更新', () => {
    const host = document.createElement('div')
    const selected = createState('second')
    const direction = createState<'ascending' | 'descending'>('ascending')
    const numeric = createState(true)
    const changes: string[] = []
    const dispose = render(() => <>
      <Piv as="select" htmlProps={{ value: selected }}
        on={{ change: ({ element }) => { const value = (element as HTMLSelectElement).value; changes.push(value); selected.set(value) } }}>
        <Piv as="option" htmlProps={{ value: 'first', selected: () => val(selected) === 'first' }}>甲</Piv>
        <Piv as="option" htmlProps={{ value: 'second', selected: () => val(selected) === 'second' }}>乙</Piv>
      </Piv>
      <Piv as="table"><Piv as="thead"><Piv as="tr">
        <Piv as="th" htmlProps={{ scope: 'col', 'aria-sort': direction, 'data-numeric': () => val(numeric) ? 'true' : undefined }}>月租</Piv>
      </Piv></Piv></Piv>
    </>, host)
    flush()
    const select = host.querySelector('select')!
    const header = host.querySelector('th')!
    expect(select.value).toBe('second')
    expect(select.options[1].selected).toBe(true)
    expect(header.getAttribute('scope')).toBe('col')
    selected.set('first')
    direction.set('descending')
    numeric.set(false)
    flush()
    expect(select.value).toBe('first')
    expect(select.options[0].selected).toBe(true)
    expect(select.options[1].selected).toBe(false)
    expect(header.getAttribute('aria-sort')).toBe('descending')
    expect(header.hasAttribute('data-numeric')).toBe(false)
    select.value = 'second'
    select.dispatchEvent(new Event('change', { bubbles: true }))
    flush()
    expect(changes).toEqual(['second'])
    expect(val(selected)).toBe('second')
    selected.set('first')
    flush()
    expect(select.value).toBe('first')
    dispose()
  })

  test('插件和 ref 在子节点插入前初始化，mount 后可见子节点且旁读不重建分支', () => {
    const host = document.createElement('div')
    const visible = createState(true)
    const incidental = createState('before')
    const Context = createContext('default')
    const observations: string[] = []
    const plugin = createPivPlugin(({ element }) => {
      val(incidental)
      observations.push(`plugin:${element.childElementCount}:${useContext(Context)}`)
      onMount(() => { observations.push(`mount:${element.childElementCount}`) })
      return undefined
    })
    const dispose = render(() => <Context value="provided"><Piv if={visible} plugin={plugin}
      ref={element => { val(incidental); observations.push(`ref:${element.childElementCount}`) }}>
      <span>child</span>
    </Piv></Context>, host)
    flush()
    const element = host.firstElementChild
    expect(observations).toEqual(['plugin:0:provided', 'ref:0', 'mount:1'])
    incidental.set('after')
    flush()
    expect(host.firstElementChild).toBe(element)
    expect(observations).toHaveLength(3)
    dispose()
  })

  test.each(['input', 'textarea', 'img', 'iframe'] as const)('%s 保留不插入 children 的模板契约', tag => {
    const host = document.createElement('div')
    const dispose = render(() => <Piv as={tag}><span>ignored</span></Piv>, host)
    expect(host.firstElementChild?.localName).toBe(tag)
    expect(host.firstElementChild?.childNodes).toHaveLength(0)
    dispose()
  })

  test('外部 ref 拿到已提交初始字段的真实 DOM', () => {
    const host = document.createElement('div')
    let observed: unknown
    const dispose = render(() => <Piv as="input" style={{ color: 'red' }} htmlProps={{ value: 'ready', disabled: true }}
      ref={element => { observed = [element.style.color, element.value, element.disabled] }} />, host)
    expect(observed).toEqual(['red', 'ready', true])
    dispose()
  })

  test('同值来源替换后仅跟随新来源，字段退出恢复绑定前的 DOM', () => {
    const host = document.createElement('div')
    const oldValue = createState('red')
    const newValue = createState('red')
    const style = createState({ color: oldValue })
    const htmlProps = createState<{ value?: typeof oldValue }>({ value: oldValue })
    const className = createState('shared old')
    const dispose = render(() => <Piv as="input" style={style} htmlProps={htmlProps}
      class={['shared', className]} />, host)
    const element = host.firstElementChild as HTMLInputElement
    style.set({ color: newValue })
    htmlProps.set({ value: newValue })
    className.set('shared new')
    flush()
    expect(element.style.color).toBe('red')
    expect(element.value).toBe('red')
    expect(element.classList.contains('shared')).toBe(true)
    expect(element.classList.contains('old')).toBe(false)
    oldValue.set('green')
    flush()
    expect(element.style.color).toBe('red')
    expect(element.value).toBe('red')
    newValue.set('blue')
    flush()
    expect(element.style.color).toBe('blue')
    expect(element.value).toBe('blue')
    htmlProps.set({})
    flush()
    expect(element.value).toBe('')
    dispose()
    expect(element.style.color).toBe('')
    expect(element.className).toBe('')
  })

  test('自身隐藏后释放旧元素资源，重建和卸载分别清理当前元素', async () => {
    const host = document.createElement('div')
    const visible = createState(true)
    const className = createState('before')
    const initialized: Element[] = []
    const cleaned: Element[] = []
    let clicks = 0
    const plugin = createPivPlugin(({ element }) => {
      initialized.push(element)
      onCleanup(() => cleaned.push(element))
      return undefined
    })
    const dispose = render(() => <Piv if={visible} class={className} plugin={plugin}
      on={{ click: () => { clicks += 1 } }} ref={element => {
        element.setAttribute('data-ref', 'ready')
      }} />, host)
    const oldElement = host.firstElementChild as HTMLElement
    expect(initialized).toEqual([oldElement])
    expect(oldElement.dataset.ref).toBe('ready')
    oldElement.click()
    expect(clicks).toBe(1)

    visible.set(false)
    flush()
    await Promise.resolve()
    expect(host.firstElementChild).toBeNull()
    expect(cleaned).toEqual([oldElement])
    const disposedClassName = oldElement.className
    className.set('after')
    flush()
    await Promise.resolve()
    expect(oldElement.className).toBe(disposedClassName)
    oldElement.click()
    expect(clicks).toBe(1)

    visible.set(true)
    flush()
    await Promise.resolve()
    const newElement = host.firstElementChild as HTMLElement
    expect(newElement).not.toBe(oldElement)
    expect(newElement.className).toBe('after')
    expect(initialized).toEqual([oldElement, newElement])
    newElement.click()
    expect(clicks).toBe(2)
    dispose()
    expect(cleaned).toEqual([oldElement, newElement])
    newElement.click()
    expect(clicks).toBe(2)
  })
})

describe('Piv children', () => {
  test('if 隐藏时不首次求值，children 随显示分支清理与重建', () => {
    const host = document.createElement('div')
    const visible = createState(false)
    let initialized = 0
    let cleaned = 0
    function Child() {
      initialized += 1
      onCleanup(() => { cleaned += 1 })
      return <span>child</span>
    }
    const dispose = render(() => <Piv if={visible}><Child /></Piv>, host)
    expect([initialized, cleaned]).toEqual([0, 0])
    visible.set(true)
    flush()
    const child = host.querySelector('span')
    expect([initialized, cleaned]).toEqual([1, 0])
    visible.set(false)
    flush()
    expect(host.firstElementChild).toBeNull()
    expect([initialized, cleaned]).toEqual([1, 1])
    visible.set(true)
    flush()
    expect(host.querySelector('span')).not.toBe(child)
    expect([initialized, cleaned]).toEqual([2, 1])
    dispose()
    expect([initialized, cleaned]).toEqual([2, 2])
  })

  test('StateView 可以作为 children 直接传入并持续更新', () => {
    const host = document.createElement('div')
    const content = createState('修改前')
    const dispose = render(() => <Piv>{content}</Piv>, host)
    const element = host.firstElementChild!

    expect(element.textContent).toBe('修改前')

    content.set('修改后')
    flush()

    expect(host.firstElementChild).toBe(element)
    expect(element.textContent).toBe('修改后')

    dispose()
  })

  test('动态文本来源更新后提交后更新同一个 DOM 的文本', () => {
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
    flush()
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
    flush()
    expect(host.querySelector('span')?.textContent).toBe('已显示')

    dispose()
  })
})

describe('Piv Source 属性', () => {
  test('合并层输出稳定 id Source，持续跟随声明换源及各来源合并', () => {
    const shadow = createState('shadow')
    const pluginId = createState('plugin')
    const previous = createState('direct')
    const next = createState('direct')
    const [readSource, setSource] = createSignal(previous)
    const { merged, dispose } = createRoot(dispose => ({
      merged: mergePivProps(document.createElement('div'), {
        get id() { return readSource() },
        shadowProps: { id: shadow },
        plugin: createPivPlugin(() => ({ id: pluginId })),
      }),
      dispose,
    }))
    const source = merged.id
    expect(isStateView(source)).toBe(true)
    expect(val(source)).toEqual(['shadow', 'plugin', 'direct'])
    setSource(next)
    flush()
    expect(merged.id).toBe(source)
    previous.set('旧来源退出')
    shadow.set('shadow-next')
    pluginId.set('plugin-next')
    next.set('direct-next')
    flush()
    expect(merged.id).toBe(source)
    expect(val(source)).toEqual(['shadow-next', 'plugin-next', 'direct-next'])
    dispose()
  })

  test('id getter 整体换源后只跟随新来源，并保留数组值及卸载边界', () => {
    const host = document.createElement('div')
    const previous = createState<string | string[] | undefined>('same')
    const next = createState<string | string[] | undefined>('same')
    const [readSource, setSource] = createSignal(previous)
    const dispose = render(() => <Piv id={readSource()} />, host)
    const element = host.firstElementChild as HTMLElement
    expect(element.id).toBe('same')
    setSource(next)
    flush()
    previous.set('旧来源退出')
    flush()
    expect(element.id).toBe('same')
    next.set(['first', 'second'])
    flush()
    expect(element.id).toBe('first,second')
    next.set(undefined)
    flush()
    expect(element.hasAttribute('id')).toBe(false)
    dispose()
    next.set('卸载后')
    flush()
    expect(element.hasAttribute('id')).toBe(false)
  })

  test('id 接收单个 StateView 并持续更新真实 DOM 身份', () => {
    const host = document.createElement('div')
    const id = createState<string | undefined>('before')
    const dispose = render(() => <Piv id={id} />, host)
    const element = host.firstElementChild as HTMLElement

    expect(element.id).toBe('before')

    id.set('after')
    flush()
    expect(element.id).toBe('after')

    id.set(undefined)
    flush()
    expect(element.hasAttribute('id')).toBe(false)

    dispose()
  })

  test('id 可由 shadowProps 或 plugin 提供，多个来源沿用普通数组合并', () => {
    const host = document.createElement('div')
    const plugin = createPivPlugin(() => ({ id: 'from-plugin' }))
    const dispose = render(
      () => (
        <>
          <Piv plugins={plugin} />
          <Piv shadowProps={{ id: 'from-shadow-props' }} />
          <Piv
            id="from-direct"
            shadowProps={{ id: 'from-shadow-props' }}
            plugins={plugin}
          />
          <Piv id={['first', 'second']} />
        </>
      ),
      host,
    )
    const [pluginElement, shadowElement, directElement, arrayElement] = [...host.children] as HTMLElement[]

    expect(pluginElement.id).toBe('from-plugin')
    expect(shadowElement.id).toBe('from-shadow-props')
    expect(directElement.id).toBe('from-shadow-props,from-plugin,from-direct')
    expect(arrayElement.id).toBe('first,second')

    dispose()
  })

  test('class、style 和 htmlProps 都可以直接接收整体 StateView', () => {
    const host = document.createElement('div')
    const className = createState('before')
    const style = createState({ color: 'red' })
    const htmlProps = createState({ 'data-value': 'before' })
    const dispose = render(
      () => <Piv class={className} style={style} htmlProps={htmlProps} />,
      host,
    )
    const element = host.firstElementChild as HTMLElement

    expect(element.className).toBe('before')
    expect(element.style.color).toBe('red')
    expect(element.getAttribute('data-value')).toBe('before')

    className.set('after')
    flush()
    style.set({ color: 'blue' })
    flush()
    htmlProps.set({ 'data-value': 'after' })
    flush()

    expect(element.className).toBe('after')
    expect(element.style.color).toBe('blue')
    expect(element.getAttribute('data-value')).toBe('after')

    dispose()
  })

  test('UIKit StateView 提交后更新 class 和 data attribute', () => {
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
    flush()
    value.set(4)
    flush()

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
    flush()

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
    flush()

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
    flush()
    backgroundColor.set('white')
    flush()

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
    flush()

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
    flush()

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
    flush()
    expect(element.getAttribute('data-value')).toBe('direct-before')
    expect(pluginValueReadCount).toBe(0)

    directValue.set('direct-after')
    flush()
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
    flush()

    expect(element.value).toBe('')
    expect(element.checked).toBe(false)

    dispose()
  })
})
