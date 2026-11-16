/**
 * Piv 声明组织与节点语义验证。
 *
 * 检查来源优先级、实例名称、动态绑定及组件生命周期。
 *
 * 保证管理层声明正确交给底层真实元素，不复制节点或改变声明所有权。
 */
import { flush, createRoot, createSignal } from 'solid-js'
// @vitest-environment jsdom

import { render } from '@solidjs/web'
import { describe, expect, test, vi } from 'vitest'
import * as idBinding from './id'
import * as classBinding from './className'
import * as styleBinding from './handleStyle'
import * as htmlBinding from './handleHTMLProps'
import * as refBinding from './domRef'
import * as eventBinding from './on/handleOn'
import type { PivProps } from './Piv'
import { bindStyleConfig } from '../tools/styleConfig'
import { createComponentPropsDirector } from '../tools/componentPropsDirector'
import { pivPropsDefinition } from './Piv.prop'
import {
  createContext,
  createState,
  isStateView,
  onCleanup,
  onMount,
  useContext,
  val,
} from '@/foundation'
import { Piv } from './Piv'
import { ElementDeclarationsContext } from './elementDeclarations'
import { createInactivePlugin } from '@/components/plugins/tools/createInactivePlugin'
import type { ShadowProps } from './plugin/mergePivProps'
import type { PivTag } from './domMap'
import { mergePivProps } from './plugin/mergePivProps'

describe('Piv 生命周期', () => {
  test('shadowProps 的 as 按来源优先级确定，首次创建后标签保持固定', () => {
    const host = document.createElement('div')
    const tag = createState<'button' | 'a' | undefined>(undefined)
    const visible = createState(false)
    const dispose = render(
      () => (
        <>
          <Piv
            shadowProps={[
              { as: 'span' },
              {
                as: undefined,
                shadowProps: {
                  get as() {
                    return val(tag)
                  },
                  if: visible,
                },
              },
            ]}
          />
          <Piv as="section" shadowProps={{ as: 'span' }} />
        </>
      ),
      host,
    )
    expect(host.querySelector('button')).toBeNull()
    expect(host.querySelector('section')).not.toBeNull()
    tag.set('button')
    visible.set(true)
    flush()
    const first = host.querySelector('button')
    expect(first).not.toBeNull()
    tag.set('a')
    flush()
    expect(host.querySelector('button')).toBe(first)
    visible.set(false)
    flush()
    visible.set(true)
    flush()
    expect(host.querySelector('button')).not.toBeNull()
    expect(host.querySelector('button')).toBe(first)
    expect(host.querySelector('a')).toBeNull()
    dispose()
  })

  test('显式 undefined 的 if 保留空分支，隐藏时不读取内部字段或初始化插件', () => {
    const host = document.createElement('div')
    const hidden = {
      get as(): 'button' {
        throw new Error('不应读取隐藏元素类型')
      },
      get class(): string {
        throw new Error('不应解析隐藏字段')
      },
      is: testPlugin({
        onElement: () => {
          throw new Error('不应接入隐藏插件元素')
        },
      }),
    }
    const dispose = render(
      () => (
        <>
          <Piv if={undefined} shadowProps={{ shadowProps: hidden, if: true }} />
          <Piv
            shadowProps={[{ if: true }, { if: undefined, shadowProps: hidden }]}
          />
          <Piv shadowProps={{ if: false, shadowProps: hidden }} />
          <Piv class="visible" />
        </>
      ),
      host,
    )
    expect(host.childElementCount).toBe(1)
    expect(host.firstElementChild?.className).toBe('visible')
    dispose()
  })

  test('研究图表和表单使用相同的 Piv 原生元素契约', () => {
    const host = document.createElement('div')
    let canvas: HTMLCanvasElement | undefined
    const dispose = render(
      () => (
        <>
          <Piv
            as="canvas"
            domRef={(element) => {
              canvas = element
            }}
            htmlProps={{ width: 320, height: 180 }}
          />
          <Piv as="fieldset">
            <Piv as="legend">范围</Piv>
          </Piv>
          <Piv as="small">说明</Piv>
          <Piv as="strong">成绩</Piv>
          <Piv as="dl">
            <Piv as="dt">名称</Piv>
            <Piv as="dd">内容</Piv>
          </Piv>
          <Piv as="ol">
            <Piv as="li">项目</Piv>
          </Piv>
          <Piv as="br" />
        </>
      ),
      host,
    )
    flush()
    expect(canvas).toBe(host.querySelector('canvas'))
    expect(canvas?.width).toBe(320)
    expect(canvas?.height).toBe(180)
    for (const tag of [
      'canvas',
      'fieldset',
      'legend',
      'small',
      'strong',
      'dl',
      'dt',
      'dd',
      'ol',
      'br',
    ]) {
      expect(host.querySelector(tag)?.localName).toBe(tag)
    }
    expect(
      host.querySelector('fieldset')?.querySelector('legend')?.textContent,
    ).toBe('范围')
    dispose()
    expect(host.childElementCount).toBe(0)
  })

  test('option 随当前值更新选中项并发布 change，表头原生语义随状态更新', () => {
    const host = document.createElement('div')
    const selected = createState('second')
    const direction = createState<'ascending' | 'descending'>('ascending')
    const numeric = createState(true)
    const changes: string[] = []
    const dispose = render(
      () => (
        <>
          <Piv
            as="select"
            htmlProps={{ value: selected }}
            on={{
              change: ({ element }) => {
                const value = (element as HTMLSelectElement).value
                changes.push(value)
                selected.set(value)
              },
            }}
          >
            <Piv
              as="option"
              htmlProps={{
                value: 'first',
                selected: () => val(selected) === 'first',
              }}
            >
              甲
            </Piv>
            <Piv
              as="option"
              htmlProps={{
                value: 'second',
                selected: () => val(selected) === 'second',
              }}
            >
              乙
            </Piv>
          </Piv>
          <Piv as="table">
            <Piv as="thead">
              <Piv as="tr">
                <Piv
                  as="th"
                  htmlProps={{
                    'scope': 'col',
                    'aria-sort': direction,
                    'data-numeric': () => (val(numeric) ? 'true' : undefined),
                  }}
                >
                  月租
                </Piv>
              </Piv>
            </Piv>
          </Piv>
        </>
      ),
      host,
    )
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

  test('能力构建早于节点创建，Plugin 的 domRef 与直接 domRef 在子节点插入前接入，mount 后可见子节点且旁读不重建分支', () => {
    const host = document.createElement('div')
    const visible = createState(true)
    const incidental = createState('before')
    const Context = createContext('default')
    const observations: string[] = []
    let builds = 0
    const dispose = render(() => {
      const plugin = createInactivePlugin({
        name: 'observation',
        pluginCore({ addProps }) {
          builds += 1
          addProps({
            domRef: (el) => {
              val(incidental)
              observations.push(
                `element:${el.childElementCount}:${useContext(Context)}`,
              )
              onMount(() => {
                observations.push(`mount:${el.childElementCount}`)
              })
            },
          })
          return {}
        },
      })()
      return (
        <Context value="provided">
          <Piv
            if={visible}
            is={plugin}
            domRef={(element) => {
              val(incidental)
              observations.push(`domRef:${element.childElementCount}`)
            }}
          >
            <span>child</span>
          </Piv>
        </Context>
      )
    }, host)
    flush()
    const element = host.firstElementChild
    expect(builds).toBe(1)
    expect(observations).toEqual(['element:0:provided', 'domRef:0', 'mount:1'])
    incidental.set('after')
    flush()
    expect(host.firstElementChild).toBe(element)
    expect(builds).toBe(1)
    expect(observations).toHaveLength(3)
    dispose()
  })

  test.each(['input', 'textarea', 'img', 'iframe'] as const)(
    '%s 保留不插入 children 的模板契约',
    (tag) => {
      const host = document.createElement('div')
      const dispose = render(
        () => (
          <Piv as={tag}>
            <span>ignored</span>
          </Piv>
        ),
        host,
      )
      expect(host.firstElementChild?.localName).toBe(tag)
      expect(host.firstElementChild?.childNodes).toHaveLength(0)
      dispose()
    },
  )

  test('外部 domRef 拿到已提交初始字段的真实 DOM', () => {
    const host = document.createElement('div')
    let observed: unknown
    const dispose = render(
      () => (
        <Piv
          as="input"
          style={{ color: 'red' }}
          htmlProps={{ value: 'ready', disabled: true }}
          domRef={(element) => {
            observed = [element.style.color, element.value, element.disabled]
          }}
        />
      ),
      host,
    )
    expect(observed).toEqual(['red', 'ready', true])
    dispose()
  })

  test('同值来源替换后仅跟随新来源，字段退出恢复绑定前的 DOM', () => {
    const host = document.createElement('div')
    const oldValue = createState('red')
    const newValue = createState('red')
    const style = createState({ color: oldValue })
    const htmlProps = createState<{ value?: typeof oldValue }>({
      value: oldValue,
    })
    const className = createState('shared old')
    const dispose = render(
      () => (
        <Piv
          as="input"
          style={style}
          htmlProps={htmlProps}
          class={['shared', className]}
        />
      ),
      host,
    )
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

  test('shadowProps 条件显隐保留元素绑定，最终卸载才清理', async () => {
    const host = document.createElement('div')
    const visible = createState(true)
    const className = createState('before')
    const initialized: Element[] = []
    const cleaned: Element[] = []
    let clicks = 0
    const plugin = testPlugin({
      onElement: ({ element }) => {
        initialized.push(element)
        return () => cleaned.push(element)
      },
    })
    const dispose = render(
      () => (
        <Piv
          shadowProps={{ if: visible }}
          class={className}
          is={plugin}
          on={{
            click: () => {
              clicks += 1
            },
          }}
          domRef={(element) => {
            element.setAttribute('data-ref', 'ready')
          }}
        />
      ),
      host,
    )
    const oldElement = host.firstElementChild as HTMLElement
    expect(initialized).toEqual([oldElement])
    expect(oldElement.dataset.ref).toBe('ready')
    oldElement.click()
    expect(clicks).toBe(1)

    visible.set(false)
    flush()
    await Promise.resolve()
    expect(host.firstElementChild).toBeNull()
    expect(cleaned).toEqual([])
    className.set('after')
    flush()
    await Promise.resolve()
    expect(oldElement.className).toBe('after')
    oldElement.click()
    expect(clicks).toBe(2)

    visible.set(true)
    flush()
    await Promise.resolve()
    const newElement = host.firstElementChild as HTMLElement
    expect(newElement).toBe(oldElement)
    expect(newElement.className).toBe('after')
    expect(initialized).toEqual([oldElement])
    newElement.click()
    expect(clicks).toBe(3)
    dispose()
    expect(cleaned).toEqual([oldElement])
    newElement.click()
    expect(clicks).toBe(3)
  })
})

describe('Piv children', () => {
  test('if 首次隐藏不求值，已创建 children 跨显隐保留到最终卸载', () => {
    const host = document.createElement('div')
    const visible = createState(false)
    let initialized = 0
    let cleaned = 0
    function Child() {
      initialized += 1
      onCleanup(() => {
        cleaned += 1
      })
      return <span>child</span>
    }
    const dispose = render(
      () => (
        <Piv if={visible}>
          <Child />
        </Piv>
      ),
      host,
    )
    expect([initialized, cleaned]).toEqual([0, 0])
    visible.set(true)
    flush()
    const child = host.querySelector('span')
    expect([initialized, cleaned]).toEqual([1, 0])
    visible.set(false)
    flush()
    expect(host.firstElementChild).toBeNull()
    expect([initialized, cleaned]).toEqual([1, 0])
    visible.set(true)
    flush()
    expect(host.querySelector('span')).toBe(child)
    expect([initialized, cleaned]).toEqual([1, 0])
    dispose()
    expect([initialized, cleaned]).toEqual([1, 1])
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
  test('合并字段在消费时读取最新 id 来源及各来源合并', () => {
    const shadow = createState('shadow')
    const pluginId = createState('plugin')
    const previous = createState('direct')
    const next = createState('direct')
    const [readSource, setSource] = createSignal(previous)
    const { merged, dispose } = createRoot((dispose) => ({
      merged: mergePivProps({
        get id() {
          return readSource()
        },
        shadowProps: { id: shadow },
        is: testPlugin({ declarations: [{ id: pluginId }] }),
      }),
      dispose,
    }))
    expect(val(merged.id)).toEqual(['shadow', 'plugin', 'direct'])
    setSource(next)
    flush()
    previous.set('旧来源退出')
    shadow.set('shadow-next')
    pluginId.set('plugin-next')
    next.set('direct-next')
    flush()
    expect(val(merged.id)).toEqual([
      'shadow-next',
      'plugin-next',
      'direct-next',
    ])
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
    const plugin = testPlugin({ declarations: [{ id: 'from-plugin' }] })
    const dispose = render(
      () => (
        <>
          <Piv is={plugin} />
          <Piv shadowProps={{ id: 'from-shadow-props' }} />
          <Piv
            id="from-direct"
            shadowProps={{ id: 'from-shadow-props' }}
            is={plugin}
          />
          <Piv id={['first', 'second']} />
        </>
      ),
      host,
    )
    const [pluginElement, shadowElement, directElement, arrayElement] = [
      ...host.children,
    ] as HTMLElement[]

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
    const nestedPlugin = testPlugin({
      declarations: [{ class: 'from-nested-plugin' }],
    })
    const plugin = testPlugin({
      declarations: [{ class: 'from-plugin', is: nestedPlugin }],
    })

    function LayeredClass() {
      const [value, updateValue] = createSignal(2)
      setValue = updateValue
      return (
        <Piv
          is={plugin}
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
      return (
        <Piv
          style={{ 'color': color(), 'background-color': backgroundColor }}
        />
      )
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
    const pluginStyles = createState([
      { 'color': 'green', 'background-color': 'black' },
    ])
    const directStyles = createState<
      Array<{ 'color'?: string; 'border-color'?: string }>
    >([{ color: 'red' }])
    const plugin = testPlugin({ declarations: [{ style: pluginStyles }] })
    const dispose = render(() => <Piv is={plugin} style={directStyles} />, host)
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
  test('跨来源的 mergable 与函数按优先级接收前值', () => {
    const host = document.createElement('div')
    const dispose = render(
      () => (
        <Piv
          shadowProps={{ htmlProps: { 'data-value': { mergable: 'first' } } }}
          htmlProps={{
            'data-value': [
              { mergable: 'second' },
              (previous) => `${previous} third`,
            ],
          }}
        />
      ),
      host,
    )
    expect(host.firstElementChild?.getAttribute('data-value')).toBe(
      'first second third',
    )
    dispose()
  })

  test('普通值覆盖低来源，改为 mergable 后跟随低来源更新', () => {
    const host = document.createElement('div')
    const low = createState('first')
    const merge = createState(false)
    let reads = 0
    const dispose = render(
      () => (
        <Piv
          shadowProps={{
            htmlProps: {
              get 'data-value'() {
                reads++
                return val(low)
              },
            },
          }}
          htmlProps={{
            get 'data-value'() {
              return val(merge) ? { mergable: 'last' } : 'override'
            },
          }}
        />
      ),
      host,
    )
    const element = host.firstElementChild!
    expect(element.getAttribute('data-value')).toBe('override')
    expect(reads).toBe(0)
    low.set('changed')
    flush()
    expect(reads).toBe(0)
    merge.set(true)
    flush()
    expect(element.getAttribute('data-value')).toBe('changed last')
    low.set('next')
    flush()
    expect(element.getAttribute('data-value')).toBe('next last')
    dispose()
  })

  test('高优先级 Source 的 undefined 仍覆盖低来源', () => {
    const host = document.createElement('div')
    const value = createState<string | undefined>(undefined)
    const dispose = render(
      () => (
        <Piv
          shadowProps={{ htmlProps: { 'data-value': 'low' } }}
          htmlProps={{ 'data-value': value }}
        />
      ),
      host,
    )
    const element = host.firstElementChild!
    expect(element.hasAttribute('data-value')).toBe(false)
    value.set('high')
    flush()
    expect(element.getAttribute('data-value')).toBe('high')
    value.set(undefined)
    flush()
    expect(element.hasAttribute('data-value')).toBe(false)
    dispose()
  })

  test('高优先级空列表及 Source 空列表仍覆盖低来源', () => {
    const host = document.createElement('div')
    const value = createState<string[]>([])
    const dispose = render(
      () => (
        <>
          <Piv
            shadowProps={{ htmlProps: { 'data-value': 'low' } }}
            htmlProps={{ 'data-value': [] }}
          />
          <Piv
            shadowProps={{ htmlProps: { 'data-value': 'low' } }}
            htmlProps={{ 'data-value': value }}
          />
        </>
      ),
      host,
    )
    expect(
      [...host.children].map((element) => element.getAttribute('data-value')),
    ).toEqual([null, null])
    value.set(['high'])
    flush()
    expect(host.children[1].getAttribute('data-value')).toBe('high')
    value.set([])
    flush()
    expect(host.children[1].getAttribute('data-value')).toBeNull()
    dispose()
  })
  test('Solid 动态 htmlProps 更新时会清除旧字段并写入新字段', () => {
    const host = document.createElement('div')
    let setActive!: (active: boolean) => void

    function DynamicHTMLProps() {
      const [active, updateActive] = createSignal(false)
      setActive = updateActive
      return (
        <Piv
          htmlProps={
            active() ? { 'data-active': 'yes' } : { 'data-id': 'base' }
          }
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
    const plugin = testPlugin({
      declarations: [
        {
          htmlProps: {
            get 'data-value'() {
              pluginValueReadCount += 1
              return pluginValue
            },
          },
        },
      ],
    })
    const dispose = render(
      () => <Piv is={plugin} htmlProps={{ 'data-value': directValue }} />,
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
    const value = createState('已填写')
    let setActive!: (active: boolean) => void

    function DynamicInputProps() {
      const [active, updateActive] = createSignal(true)
      setActive = updateActive
      return (
        <Piv
          as="input"
          htmlProps={
            active() ? { value, 'checked': true, 'data-value': value } : {}
          }
        />
      )
    }

    const dispose = render(() => <DynamicInputProps />, host)
    const element = host.firstElementChild as HTMLInputElement

    expect(element.value).toBe('已填写')
    expect(element.checked).toBe(true)
    value.set('第二次')
    flush()
    expect(element.value).toBe('第二次')
    expect(element.getAttribute('data-value')).toBe('第二次')
    value.set('第三次')
    flush()
    expect(element.value).toBe('第三次')
    expect(element.getAttribute('data-value')).toBe('第三次')

    setActive(false)
    flush()

    expect(element.value).toBe('')
    expect(element.checked).toBe(false)
    expect(element.hasAttribute('data-value')).toBe(false)

    setActive(true)
    flush()
    expect(element.value).toBe('第三次')

    dispose()
    expect(element.value).toBe('')
    expect(element.hasAttribute('data-value')).toBe(false)
  })
})

function testPlugin(
  options: {
    declarations?: ShadowProps<PivTag>[]
    onElement?: (payload: { element: HTMLElement }) => void | (() => void)
  } = {},
) {
  return createInactivePlugin({
    name: 'test',
    pluginCore({ addProps }) {
      for (const declaration of options.declarations ?? [])
        addProps(declaration)
      if (options.onElement)
        addProps({ domRef: (el) => options.onElement?.({ element: el }) })
      return {}
    },
  })()
}

test('实例label沿来源合并并转换根ARIA，显式原生名称优先且子节点不继承', () => {
  const host = document.createElement('main')
  const label = createState<string | undefined>('保存草稿')
  const nativeLabel = createState<string | undefined>('原生名称')
  const dispose = render(
    () => (
      <>
        <Piv
          label={label}
          shadowProps={[{ label: '低优先级' }, { label: '补充名称' }]}
        >
          <Piv class="child" />
        </Piv>
        <Piv label={label} htmlProps={{ 'aria-label': nativeLabel }} />
        <Piv label={label} />
        <ElementDeclarationsContext
          value={[{ htmlProps: { 'aria-label': '继承原生名称' } }]}
        >
          <Piv label={label} />
        </ElementDeclarationsContext>
      </>
    ),
    host,
  )
  try {
    const [first, second, third, inherited] = [...host.children]
    expect(first.getAttribute('aria-label')).toBe('低优先级 补充名称 保存草稿')
    expect(second.getAttribute('aria-label')).toBe('原生名称')
    expect(third.getAttribute('aria-label')).toBe('保存草稿')
    expect(inherited.getAttribute('aria-label')).toBe('保存草稿')
    expect(first.querySelector('.child')!.hasAttribute('aria-label')).toBe(
      false,
    )
    label.set('提交草稿')
    flush()
    expect(first.getAttribute('aria-label')).toBe('低优先级 补充名称 提交草稿')
    expect(third.getAttribute('aria-label')).toBe('提交草稿')
    nativeLabel.set(undefined)
    flush()
    expect(second.hasAttribute('aria-label')).toBe(false)
    label.set(undefined)
    flush()
    expect(first.getAttribute('aria-label')).toBe('低优先级 补充名称')
    expect(second.hasAttribute('aria-label')).toBe(false)
    expect(third.hasAttribute('aria-label')).toBe(false)
    expect(inherited.hasAttribute('aria-label')).toBe(false)
    expect(host.firstElementChild).toBe(first)
  } finally {
    dispose()
  }
})

test('未声明能力不建立消费链，动态声明逐项接入并在退出时撤销节点结果', () => {
  const bindings = [
    vi.spyOn(idBinding, 'consumeId'),
    vi.spyOn(classBinding, 'consumeClassName'),
    vi.spyOn(styleBinding, 'consumeStyle'),
    vi.spyOn(htmlBinding, 'consumeHTMLProps'),
    vi.spyOn(refBinding, 'consumeDomRefs'),
    vi.spyOn(eventBinding, 'toEventListenersList'),
  ]
  const host = document.createElement('main')
  const [readProps, setProps] = createSignal<PivProps>({})
  const props = new Proxy<PivProps>(
    {},
    {
      get: (_, key) => Reflect.get(readProps(), key),
      has: (_, key) => key in readProps(),
      ownKeys: () => Reflect.ownKeys(readProps()),
      getOwnPropertyDescriptor: (_, key) =>
        key in readProps()
          ? { enumerable: true, configurable: true }
          : undefined,
    },
  )
  const dispose = render(() => Piv(props), host)
  try {
    for (const binding of bindings) expect(binding).not.toHaveBeenCalled()
    const element = host.firstElementChild!
    const label = createState<string | undefined>(undefined)
    const item = createState('收货地址')
    const refCleanup = vi.fn()
    const ref = vi.fn(() => refCleanup)
    const onClick = vi.fn()
    setProps({
      id: 'active',
      class: 'active',
      style: { color: 'red' },
      label: [label, item],
      on: { click: onClick },
      domRef: ref,
      children: '已加入',
    })
    flush()
    expect(element.getAttribute('aria-label')).toBe('收货地址')
    label.set('筛选条件')
    item.set('配送地址')
    flush()
    expect(element.getAttribute('aria-label')).toBe('筛选条件 配送地址')
    expect(element.textContent).toBe('已加入')
    expect(element.id).toBe('active')
    element.dispatchEvent(new MouseEvent('click'))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(ref).toHaveBeenCalledTimes(1)
    for (const binding of bindings) expect(binding).toHaveBeenCalledTimes(1)
    setProps({})
    flush()
    expect(element.hasAttribute('id')).toBe(false)
    expect(element.className).toBe('')
    expect(element.getAttribute('aria-label')).toBeNull()
    expect(element.textContent).toBe('')
    expect((element as HTMLElement).style.color).toBe('')
    expect(refCleanup).toHaveBeenCalledTimes(1)
    element.dispatchEvent(new MouseEvent('click'))
    expect(onClick).toHaveBeenCalledTimes(1)
    setProps({ id: 'again', label: '' })
    flush()
    expect(element.id).toBe('again')
    expect(element.getAttribute('aria-label')).toBe('')
    expect(host.firstElementChild).toBe(element)
  } finally {
    dispose()
    for (const binding of bindings) binding.mockRestore()
  }
})

test('控制入口只在显式写入后声明字段，空Source和晚加入结构来源保持响应', () => {
  const host = document.createElement('main')
  let controller!: ReturnType<
    typeof createComponentPropsDirector<PivProps, typeof pivPropsDefinition>
  >['controller']
  const html = vi.spyOn(htmlBinding, 'consumeHTMLProps')
  const dispose = render(() => {
    const directed = createComponentPropsDirector<
      PivProps,
      typeof pivPropsDefinition
    >({}, pivPropsDefinition)
    controller = directed.controller
    // 结构查看的只读访问不等于声明。
    val(directed.props.label)
    return Piv(directed.props)
  }, host)
  try {
    expect(html).not.toHaveBeenCalled()
    controller.label.set(undefined)
    flush()
    expect(html).toHaveBeenCalledTimes(1)
    controller.label.set(['筛选条件', createState('收货地址')])
    flush()
    expect(host.firstElementChild!.getAttribute('aria-label')).toBe(
      '筛选条件 收货地址',
    )
    controller.shadowProps.set({ class: 'late-shadow' })
    flush()
    expect(host.firstElementChild!.className).toBe('late-shadow')
    controller.shadowProps.set(undefined)
    flush()
    expect(host.firstElementChild!.className).toBe('')
  } finally {
    dispose()
    html.mockRestore()
  }
})

test('样式配置定义不制造实例style声明，动态配置形状接入与退出实际消费', () => {
  const host = document.createElement('main')
  const [readProps, setProps] = createSignal<{
    styleConfig?: { gap?: string }
  }>({})
  const props = new Proxy(
    {},
    {
      has: (_, key) => key in readProps(),
      get: (_, key) => Reflect.get(readProps(), key),
    },
  )
  const style = vi.spyOn(styleBinding, 'consumeStyle')
  const dispose = render(
    () => (
      <ElementDeclarationsContext value={[bindStyleConfig({}, props)]}>
        <Piv />
      </ElementDeclarationsContext>
    ),
    host,
  )
  try {
    expect(style).not.toHaveBeenCalled()
    setProps({ styleConfig: undefined })
    flush()
    expect(style).toHaveBeenCalledTimes(1)
    setProps({})
    flush()
    setProps({ styleConfig: {} })
    flush()
    expect(style).toHaveBeenCalledTimes(2)
  } finally {
    dispose()
    style.mockRestore()
  }
})

test('继承声明参与固定字段入口，插件动态退出且无关字段更新不重置once与domRef', () => {
  const host = document.createElement('main')
  const onClick = vi.fn()
  const released = vi.fn()
  const attached = vi.fn(() => released)
  const on = { click: { callback: onClick, once: true } }
  const [active, setActive] = createSignal(false)
  const [style, setStyle] = createSignal('red')
  const props: PivProps = {
    get is() {
      return active()
        ? testPlugin({
            declarations: [{ label: '插件实例', domRef: attached }],
          })
        : undefined
    },
    get style() {
      return { color: style() }
    },
    on,
  }
  Object.setPrototypeOf(props, { id: 'inherited-id', class: 'inherited-class' })
  const dispose = render(() => Piv(props), host)
  try {
    const element = host.firstElementChild!
    expect(element.id).toBe('inherited-id')
    expect(element.className).toBe('inherited-class')
    setActive(true)
    flush()
    expect(element.getAttribute('aria-label')).toBe('插件实例')
    expect(attached).toHaveBeenCalledTimes(1)
    element.dispatchEvent(new MouseEvent('click'))
    setStyle('blue')
    flush()
    element.dispatchEvent(new MouseEvent('click'))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(attached).toHaveBeenCalledTimes(1)
    setActive(false)
    flush()
    expect(released).toHaveBeenCalledTimes(1)
    expect(element.hasAttribute('aria-label')).toBe(false)
    expect(host.firstElementChild).toBe(element)
  } finally {
    dispose()
  }
})

test('共同合并只读取每份来源实际声明的字段，不激活其它来源的同名getter', () => {
  const absentRead = vi.fn()
  const source = new Proxy<PivProps<'section'>>(
    {},
    {
      has: () => false,
      get: () => {
        absentRead()
        throw new Error('未声明字段不应读取')
      },
    },
  )
  const host = document.createElement('main')
  const dispose = render(
    () => (
      <Piv<'section'>
        shadowProps={[
          source,
          { as: 'section', id: 'present', class: 'present', label: '实际声明' },
        ]}
      />
    ),
    host,
  )
  try {
    expect(absentRead).not.toHaveBeenCalled()
    expect(host.firstElementChild!.localName).toBe('section')
    expect(host.firstElementChild!.id).toBe('present')
    expect(host.firstElementChild!.getAttribute('aria-label')).toBe('实际声明')
  } finally {
    dispose()
  }
})
