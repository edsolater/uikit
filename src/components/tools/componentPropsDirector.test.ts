/** 验证同源指令写入、输入声明形状与分阶段输出，不涉及具体组件。 */
import { createRoot, flush } from 'solid-js'
import { expect, expectTypeOf, test, vi } from 'vitest'
import { createState, onCleanup, val, type Source } from '@/foundation'
import { createComponentPropsDirector } from './componentPropsDirector'

test('仅通过Prop的接收器原样读取，不进入Controller类型或运行时字段', () => {
  const first = vi.fn()
  const next = vi.fn()
  const receiver = createState(() => first)
  const { props, controller, dispose } = createRoot(dispose => ({
    ...createComponentPropsDirector({ get ref() { return val(receiver) }, count: 0 }, {
      ref: 'only-through-prop', count: 'state-value-view',
    }), dispose,
  }))
  expectTypeOf(controller).not.toHaveProperty('ref')
  expect(props.ref).toBe(first)
  expect('ref' in props).toBe(true)
  expect('ref' in controller).toBe(false)
  expect(Object.hasOwn(controller, 'ref')).toBe(false)
  expect(Object.keys(controller)).toEqual(['count'])
  expect(Reflect.get(controller, 'ref')).toBeUndefined()
  receiver.set(() => next)
  flush()
  expect(props.ref).toBe(next)
  expect(first).not.toHaveBeenCalled()
  expect(next).not.toHaveBeenCalled()
  dispose()
})

test('缺省字段首次指令可写，输入声明和未读字段保持惰性', () => {
  let reads = 0
  const raw: { active?: Source<boolean | undefined>; hidden?: string } = {
    get hidden(): string { reads++; throw new Error('不应读取') },
  }
  const { props, controller, dispose } = createRoot(dispose => ({
    ...createComponentPropsDirector(raw, { active: 'state-source-view', hidden: 'state-value-view' }), dispose,
  }))
  expect('active' in props).toBe(false)
  controller.active.set(true)
  flush()
  expect(val(props.active)).toBe(true)
  expect('active' in raw).toBe(false)
  expect(reads).toBe(0)
  dispose()
})

test('指令修改计算来源后仍跟随原生依赖更新，回调保存函数身份', () => {
  const source = createState(1)
  const first = () => 1
  const second = () => 2
  const { props, controller, dispose } = createRoot(dispose => ({
    ...createComponentPropsDirector({ count: source, callback: first }, {
      count: 'state-source-view', callback: 'state-value-view',
    }), dispose,
  }))
    expect(val(props.count)).toBe(1)
    expect(props.callback).toBe(first)
    controller.count.set(7)
    flush()
    expect(val(props.count)).toBe(7)
    source.set(2)
    flush()
    expect(val(props.count)).toBe(2)
    controller.callback.set(() => second)
    flush()
    expect(props.callback).toBe(second)
  dispose()
})

test('准备阶段基于原声明选择默认来源，输出投影不改变输入视图', () => {
  const raw: { group?: Source<string | undefined>; candidate?: Source<boolean | undefined> } = {}
  const { props, controller, input, source, dispose } = createRoot(dispose => {
    let input!: { group?: Source<string | undefined>; candidate?: Source<boolean | undefined> }
    const { props, controller } = createComponentPropsDirector(raw, { group: 'state-source-view', candidate: 'state-source-view' }, {
      defaultSources: {
        group(original) {
          input = original
          return createState(() => val(original.candidate) ? '选中' : undefined, { lazy: true })
        },
      },
      omit: ['candidate'],
    })
    const source = props.group
    return { props, controller, input, source, dispose }
  })
    expect(props.group).toBe(source)
    expect('group' in input).toBe(false)
    expect('group' in props).toBe(true)
    expect('candidate' in props).toBe(false)
    expect(Object.keys(props)).toEqual(['group'])
    controller.candidate.set(true)
    flush()
    expect(val(props.group)).toBe('选中')
    controller.group.set(undefined)
    flush()
    expect(val(props.group)).toBeUndefined()
    expect('group' in input).toBe(false)
  dispose()
})

test('显式undefined不被默认来源覆盖，额外属性与冻结输入可读取和展开', () => {
  const raw = Object.freeze({ label: undefined as string | undefined, extra: '原样' })
  const fallback = vi.fn(() => '默认')
  const dispose = createRoot(dispose => {
    const { props } = createComponentPropsDirector(raw, { label: 'state-untracked', extra: 'state-value-view' }, {
      defaultSources: { label: fallback },
    })
    expect(props.label).toBeUndefined()
    expect(fallback).not.toHaveBeenCalled()
    expect({ ...props }).toEqual({ label: undefined, extra: '原样' })
    const inherited = createComponentPropsDirector(
      Object.create({ label: undefined }) as { label?: string },
      { label: 'state-untracked' },
      { defaultSources: { label: fallback } },
    ).props
    expect('label' in inherited).toBe(true)
    expect(Object.hasOwn(inherited, 'label')).toBe(false)
    expect({ ...inherited }).toEqual({})
    expect(inherited.label).toBeUndefined()
    expect(fallback).not.toHaveBeenCalled()
    return dispose
  })
  dispose()
})

test('默认工厂捕获另一缺省字段的同一Source，首次写入及后续变化不断流', () => {
  type Props = { label?: Source<string>; count?: Source<number> }
  const countSource = vi.fn(() => 1)
  const { props, controller, dispose } = createRoot(dispose => ({
    ...createComponentPropsDirector({} as Props, { label: 'state-source-view', count: 'state-source-view' }, {
      defaultSources: {
        count: countSource,
        label(input) {
          const source = input.count
          return createState(() => `数量${val(source)}`, { lazy: true })
        },
      },
    }), dispose,
  }))
  expect(val(props.label)).toBe('数量1')
  expect(props.count).toBe(controller.count)
  controller.count.set(3)
  flush()
  expect(val(props.label)).toBe('数量3')
  expect(countSource).toHaveBeenCalledOnce()
  dispose()
})

test('首次从短命作用域读取的字段仍由Director原作用域释放', () => {
  const cleanup = vi.fn()
  const { props, controller, dispose } = createRoot(dispose => ({
    ...createComponentPropsDirector({} as { label?: Source<string> }, { label: 'state-source-view' }, {
      defaultSources: { label() { onCleanup(cleanup); return '初始' } },
    }), dispose,
  }))
  const disposeReader = createRoot(dispose => { props.label; return dispose })
  disposeReader()
  expect(cleanup).not.toHaveBeenCalled()
  controller.label.set('运行时')
  flush()
  expect(val(props.label)).toBe('运行时')
  dispose()
  expect(cleanup).toHaveBeenCalledOnce()
})
