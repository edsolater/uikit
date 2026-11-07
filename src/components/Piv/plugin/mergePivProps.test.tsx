// @vitest-environment jsdom
import { createRoot, flush } from 'solid-js'
import { render } from '@solidjs/web'
import { describe, expect, test } from 'vitest'
import { createState } from '@/foundation'
import { Piv } from '../Piv'
import { mergePivProps } from './mergePivProps'
import { defineInactivePlugin } from '@/components/plugins/tools/defineInactivePlugin'

describe('配置插件消费', () => {
  test('合并保留单来源身份与前导、后续 undefined 的不同位置', () => {
    const { missing, value, merged, trailing, literal, dispose } = createRoot(
      (dispose) => {
        const missing = createState<string | undefined>(undefined)
        const value = [['nested']]
        const merged = mergePivProps({
          class: value,
          shadowProps: { class: missing },
        })
        const trailing = mergePivProps({
          class: missing,
          shadowProps: { class: 'low' },
        })
        const literal = mergePivProps({
          class: undefined,
          shadowProps: { class: 'low' },
        })
        return { missing, value, merged, trailing, literal, dispose }
      },
    )
    try {
      expect(merged.class).toBe(value)
      missing.set('prefix')
      flush()
      expect(merged.class).toEqual(['prefix', ['nested']])
      missing.set(undefined)
      flush()
      expect(merged.class).toBe(value)
      expect(trailing.class).toEqual(['low', undefined])
      expect(literal.class).toBe('low')
    } finally {
      dispose()
    }
  })

  test('多来源只展开顶层数组，稀疏洞消失但显式 undefined 和来源读取顺序保留', () => {
    createRoot((dispose) => {
      const sparse = new Array<string | undefined>(4)
      sparse[1] = 'low'
      sparse[3] = undefined
      const reads: string[] = []
      const merged = mergePivProps({
        get class() {
          reads.push('high')
          return 'high'
        },
        shadowProps: [
          {
            get class() {
              reads.push('low')
              return sparse
            },
          },
          {
            get class() {
              reads.push('middle')
              return [['nested'], 'middle']
            },
          },
        ],
      })
      reads.length = 0
      expect(merged.class).toEqual([
        'low',
        undefined,
        ['nested'],
        'middle',
        'high',
      ])
      expect(reads).toEqual(['low', 'middle', 'high'])
      dispose()
    })
  })

  test('完整声明进入原绑定链，构建一次并提供节点接入清理', () => {
    const host = document.createElement('div')
    let builds = 0
    let nestedBuilds = 0
    let refs = 0
    let cleaned = 0
    let nestedCleaned = 0
    let clicks = 0
    const dispose = render(() => {
      const nested = defineInactivePlugin({
        name: 'nested',
        pluginCore({ addProps }) {
          nestedBuilds += 1
          addProps({
            htmlProps: { 'data-nested': 'complete' },
            domRef: () => {
              return () => {
                nestedCleaned += 1
              }
            },
          })
          addProps({
            domRef: () => () => {
              nestedCleaned += 1
            },
          })
          return {}
        },
      })()
      const injected = defineInactivePlugin({
        name: 'injected',
        pluginCore({ addProps }) {
          builds += 1
          addProps({
            id: 'complete',
            class: 'complete',
            style: { color: 'red' },
            htmlProps: { title: 'complete' },
            on: {
              click: () => {
                clicks += 1
              },
            },
            is: nested,
          })
          addProps({
            domRef: () => {
              refs += 1
              return () => {
                cleaned += 1
              }
            },
          })
          return {}
        },
      })()
      return <Piv is={injected} />
    }, host)
    const element = host.firstElementChild as HTMLElement
    expect([builds, nestedBuilds]).toEqual([1, 1])
    expect([
      element.id,
      element.className,
      element.style.color,
      element.title,
    ]).toEqual(['complete', 'complete', 'red', 'complete'])
    expect(refs).toBe(1)
    expect(element.dataset.nested).toBe('complete')
    element.click()
    expect(clicks).toBe(1)
    dispose()
    expect([cleaned, nestedCleaned]).toEqual([1, 2])
  })

  test('addProps 提交的 as 与 if 参与创建前结构选择，隐藏时不接元素', () => {
    const host = document.createElement('div')
    const visible = createState(false)
    const attached: HTMLElement[] = []
    const released: HTMLElement[] = []
    const dispose = render(() => {
      const capability = defineInactivePlugin({
        name: 'structural',
        pluginCore({ addProps }) {
          addProps({ as: 'button', if: visible })
          addProps({
            domRef: (el) => {
              attached.push(el)
              return () => released.push(el)
            },
          })
          return {}
        },
      })()
      return <Piv is={capability}>内容</Piv>
    }, host)
    expect(host.firstElementChild).toBeNull()
    expect(attached).toEqual([])

    visible.set(true)
    flush()
    const button = host.querySelector('button')!
    expect(button.textContent).toBe('内容')
    expect(attached).toEqual([button])

    visible.set(false)
    flush()
    expect(host.firstElementChild).toBeNull()
    expect(released).toEqual([button])

    visible.set(true)
    flush()
    const next = host.querySelector('button')!
    expect(next).not.toBe(button)
    expect(attached).toEqual([button, next])
    dispose()
    expect(released).toEqual([button, next])
  })

  test('is 数组后项优先，与 shadowProps 数组后项优先一致', () => {
    const host = document.createElement('div')
    const first = defineInactivePlugin({
      name: 'first',
      pluginCore({ addProps }) {
        addProps({ as: 'button' })
        return {}
      },
    })
    const second = defineInactivePlugin({
      name: 'second',
      pluginCore({ addProps }) {
        addProps({ as: 'a' })
        return {}
      },
    })
    const dispose = render(
      () => (
        <>
          <Piv is={[first(), second()]} />
          <Piv is={[second(), first()]} />
          <Piv shadowProps={[{ as: 'span' }, { as: 'p' }]} />
        </>
      ),
      host,
    )
    expect(host.children[0].localName).toBe('a')
    expect(host.children[1].localName).toBe('button')
    expect(host.children[2].localName).toBe('p')
    dispose()
  })

  test('普通回调与缺少有效 plugin 的对象被拒绝，能力结果与 plugin 均可使用', () => {
    createRoot((dispose) => {
      const capability = defineInactivePlugin({
        name: 'valid',
        pluginCore({ addProps }) {
          addProps({ htmlProps: { title: 'valid' } })
          return {}
        },
      })()
      const plainCallback = () => undefined
      const mount = (is: Parameters<typeof Piv>[0]['is']) =>
        render(() => <Piv is={is} />, document.createElement('div'))

      expect(() => mount(plainCallback as never)).toThrow('需要 Plugin')
      expect(() => mount({ plugin: plainCallback } as never)).toThrow('需要 Plugin')
      expect(() => mount({} as never)).toThrow('需要 Plugin')

      mount(capability)()
      mount(capability.plugin)()
      mount([capability, capability.plugin])()
      dispose()
    })
  })

  test('多次提交与 shadowProps 数组的嵌套声明使用相同优先级', () => {
    const host = document.createElement('div')
    const dispose = render(() => {
      const first = { shadowProps: { as: 'button' as const } }
      const second = { shadowProps: { as: 'a' as const } }
      const capability = defineInactivePlugin({
        name: 'nestedPriority',
        pluginCore({ addProps }) {
          addProps(first)
          addProps(second)
          return {}
        },
      })()
      return (
        <>
          <Piv is={capability} />
          <Piv shadowProps={[first, second]} />
        </>
      )
    }, host)
    expect([...host.children].map((element) => element.localName)).toEqual([
      'a',
      'a',
    ])
    dispose()
  })
})
