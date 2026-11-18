/** 验证同源指令写入、输入声明形状与分阶段输出，不涉及具体组件。 */
import { createMemo, createRoot, flush } from 'solid-js'
import { expect, expectTypeOf, test, vi } from 'vitest'
import { createState, onCleanup, val, type Source } from '@/foundation'
import { createComponentPropsDirector } from './componentPropsDirector'
import { createPropsDeclaration } from './propsDeclaration/shadowProps'
import { mergePivProps, pivPropAccumulation } from '../Piv/plugin/mergePivProps'

test.each([
  'state-source-view',
  'state-value-view',
  'state-untracked',
] as const)(
  'Director直接交付完整累加字段，%s保留干预、清空和上游恢复',
  (mode) => {
    const { upstream, director, props, dispose } = createRoot((dispose) => {
      type Props = {
        class?: Source<string | string[] | undefined>
        shadowProps?: { class: string }
      }
      const upstream = createState<string | undefined>('直接')
      const declaration = createPropsDeclaration<Props>(
        { class: upstream, shadowProps: { class: '补充' } },
        { accumulate: pivPropAccumulation },
      )
      const director = createComponentPropsDirector(
        declaration.peek,
        { class: mode, shadowProps: 'only-through-prop' },
        { declaration },
      )
      const props = declaration.consume(director.props)
      return { upstream, director, props, dispose }
    })
    expect(val(props.class)).toEqual(['补充', '直接'])
    director.controller.class.set('干预')
    flush()
    expect(val(props.class)).toEqual(['补充', '干预'])
    director.controller.class.set(undefined)
    flush()
    expect(val(props.class)).toBeUndefined()
    upstream.set('恢复')
    flush()
    expect(val(props.class)).toEqual(['补充', '恢复'])
    expect(director.peek('class')).toEqual(['补充', '恢复'])
    dispose()
  },
)

test.each(['state-value-view', 'state-untracked'] as const)(
  '累加字段的%s遵守外层依赖收集协议',
  (mode) => {
    const { upstream, props, observed, dispose } = createRoot((dispose) => {
      const upstream = createState('初始')
      const declaration = createPropsDeclaration(
        { class: upstream },
        { accumulate: pivPropAccumulation },
      )
      const director = createComponentPropsDirector(
        declaration.peek,
        { class: mode },
        { declaration },
      )
      const props = declaration.consume(director.props)
      const observed = createMemo(() => props.class)
      return { upstream, props, observed, dispose }
    })
    expect(observed()).toBe('初始')
    upstream.set('更新')
    flush()
    expect(observed()).toBe(mode === 'state-untracked' ? '初始' : '更新')
    expect(props.class).toBe('更新')
    dispose()
  },
)

test('取得Source视图不提前读取输入，Controller首次指令仍在初始化后执行', () => {
  const read = vi.fn(() => 2)
  const { props, controller, dispose } = createRoot((dispose) => ({
    ...createComponentPropsDirector(
      {
        get count() {
          return read()
        },
      },
      { count: 'state-source-view' },
    ),
    dispose,
  }))
  const source = props.count
  expect(read).not.toHaveBeenCalled()
  controller.count.set((value) => value + 1)
  flush()
  expect(val(source)).toBe(3)
  expect(read).toHaveBeenCalledOnce()
  dispose()
})

test('缺省与当前声明持续切换，undefined阻止缺省且工厂仅构建一次', () => {
  const current = createState<{ count?: Source<number | undefined> }>({})
  const fallback = createState<number | undefined>(3)
  const factory = vi.fn(() => fallback)
  const { props, dispose } = createRoot((dispose) => ({
    ...createComponentPropsDirector(
      new Proxy(
        {},
        {
          has: (_, key) => key in val(current),
          get: (_, key) => Reflect.get(val(current), key),
        },
      ) as { count?: Source<number | undefined> },
      { count: 'state-source-view' },
      { defaultSources: { count: factory } },
    ),
    dispose,
  }))
  expect(val(props.count)).toBe(3)
  current.set({ count: 9 })
  flush()
  expect(val(props.count)).toBe(9)
  current.set({ count: undefined })
  flush()
  expect(val(props.count)).toBeUndefined()
  current.set({})
  flush()
  expect(val(props.count)).toBe(3)
  fallback.set(5)
  flush()
  expect(val(props.count)).toBe(5)
  expect(factory).toHaveBeenCalledOnce()
  dispose()
})

test('仅通过Prop的接收器原样读取，不进入Controller类型或运行时字段', () => {
  const first = vi.fn()
  const next = vi.fn()
  const receiver = createState(() => first)
  const { props, controller, peek, dispose } = createRoot((dispose) => ({
    ...createComponentPropsDirector(
      {
        get ref() {
          return val(receiver)
        },
        payload: receiver,
        count: 0,
      },
      {
        ref: 'only-through-prop',
        payload: 'only-through-prop',
        count: 'state-value-view',
      },
    ),
    dispose,
  }))
  expectTypeOf(controller).not.toHaveProperty('ref')
  expectTypeOf(peek('payload')).toEqualTypeOf<typeof receiver>()
  expect(peek('payload')).toBe(receiver)
  expect(peek('ref')).toBe(first)
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
    get hidden(): string {
      reads++
      throw new Error('不应读取')
    },
  }
  const { props, controller, dispose } = createRoot((dispose) => ({
    ...createComponentPropsDirector(raw, {
      active: 'state-source-view',
      hidden: 'state-value-view',
    }),
    dispose,
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
  const { props, controller, dispose } = createRoot((dispose) => ({
    ...createComponentPropsDirector(
      { count: source, callback: first },
      {
        count: 'state-source-view',
        callback: 'state-value-view',
      },
    ),
    dispose,
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

test('首次消费缺省来源时构建工厂，输出投影不改变输入视图', () => {
  const raw: {
    group?: Source<string | undefined>
    candidate?: Source<boolean | undefined>
  } = {}
  const { props, controller, input, source, dispose } = createRoot(
    (dispose) => {
      let input!: {
        group?: Source<string | undefined>
        candidate?: Source<boolean | undefined>
      }
      const { props, controller } = createComponentPropsDirector(
        raw,
        { group: 'state-source-view', candidate: 'state-source-view' },
        {
          defaultSources: {
            group(original) {
              input = original
              return createState(
                () => (val(original.candidate) ? '选中' : undefined),
                { lazy: true },
              )
            },
          },
          omit: (key) => key === 'candidate',
        },
      )
      const source = props.group
      expect(input).toBeUndefined()
      expect(val(source)).toBeUndefined()
      return { props, controller, input, source, dispose }
    },
  )
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
  expect('group' in input).toBe(true)
  dispose()
})

test('显式undefined不被默认来源覆盖，额外属性与冻结输入可读取和展开', () => {
  const raw = Object.freeze({
    label: undefined as string | undefined,
    extra: '原样',
  })
  const fallback = vi.fn(() => '默认')
  const dispose = createRoot((dispose) => {
    const { props } = createComponentPropsDirector(
      raw,
      { label: 'state-untracked', extra: 'state-value-view' },
      {
        defaultSources: { label: fallback },
      },
    )
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
  const { props, controller, dispose } = createRoot((dispose) => ({
    ...createComponentPropsDirector(
      {} as Props,
      { label: 'state-source-view', count: 'state-source-view' },
      {
        defaultSources: {
          count: countSource,
          label(input) {
            const source = input.count
            return createState(() => `数量${val(source)}`, { lazy: true })
          },
        },
      },
    ),
    dispose,
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
  const { props, controller, dispose } = createRoot((dispose) => ({
    ...createComponentPropsDirector(
      {} as { label?: Source<string> },
      { label: 'state-source-view' },
      {
        defaultSources: {
          label() {
            onCleanup(cleanup)
            return '初始'
          },
        },
      },
    ),
    dispose,
  }))
  const disposeReader = createRoot((dispose) => {
    props.label
    return dispose
  })
  disposeReader()
  expect(cleanup).not.toHaveBeenCalled()
  controller.label.set('运行时')
  flush()
  expect(val(props.label)).toBe('运行时')
  dispose()
  expect(cleanup).toHaveBeenCalledOnce()
})

test.each([undefined, 'state-source-view', 'state-value-view', 'state-untracked'] as const)(
  '跨层累加保留 literal undefined 截断与之前的正值，模式=%s',
  (mode) =>
    createRoot((dispose) => {
      for (const directValue of [undefined, '保留']) {
        const declaration = createPropsDeclaration(
          { class: directValue, shadowProps: { class: undefined } },
          { accumulate: pivPropAccumulation },
        )
        const controlled = mode
          ? createComponentPropsDirector(
              declaration.peek,
              { class: mode, shadowProps: 'only-through-prop' },
              { declaration },
            )
          : undefined
        const upper = declaration.consume(
          controlled?.props ?? declaration.peek,
        )
        let lowerReads = 0
        const lower = mergePivProps({
          shadowProps: [
            {
              get class() {
                lowerReads++
                return '不应恢复'
              },
            },
            upper,
          ],
        })
        expect(val(lower.class)).toBe(directValue)
        expect(lowerReads).toBe(0)
      }
      dispose()
    }),
)

test.each([undefined, 'state-source-view', 'state-value-view', 'state-untracked'] as const)(
  '上层 Source 当前为 undefined 不截断低优先级来源，模式=%s',
  (mode) =>
    createRoot((dispose) => {
      const declaration = createPropsDeclaration(
        { class: createState<string | undefined>(undefined) },
        { accumulate: pivPropAccumulation },
      )
      const controlled = mode
        ? createComponentPropsDirector(
            declaration.peek,
            { class: mode },
            { declaration },
          )
        : undefined
      const upper = declaration.consume(
        controlled?.props ?? declaration.peek,
      )
      const lower = mergePivProps({
        shadowProps: [{ class: '仍然可用' }, upper],
      })
      expect([val(lower.class)].flat()).toContain('仍然可用')
      dispose()
    }),
)

test('跨层截断跟随 Controller 修改及上游恢复，Marker 借读不抢占字段', () => {
  const { upstream, controlled, upper, lower, dispose } = createRoot(
    (dispose) => {
      const upstream = createState<string | undefined>('直接')
      const declaration = createPropsDeclaration(
        {
          class: upstream,
          shadowProps: { class: '内部' as string | undefined },
        },
        { accumulate: pivPropAccumulation },
      )
      const controlled = createComponentPropsDirector(
        declaration.peek,
        { class: 'state-source-view', shadowProps: 'state-value-view' },
        { declaration },
      )
      const upper = declaration.consume(controlled.props)
      expect(controlled.peek('class')).toEqual(['内部', '直接'])
      const lower = mergePivProps({ shadowProps: [{ class: '外部' }, upper] })
      return { upstream, controlled, upper, lower, dispose }
    },
  )
  expect(val(lower.class)).toEqual(['外部', '内部', '直接'])
  controlled.controller.shadowProps.set({ class: undefined })
  flush()
  expect(val(lower.class)).toBe('直接')
  controlled.controller.class.set(undefined)
  flush()
  expect(val(lower.class)).toBeUndefined()
  upstream.set('恢复')
  flush()
  expect(val(lower.class)).toBe('恢复')
  expect(upper.class).toBeUndefined()
  dispose()
})

test('已处理视图保留字段转换和嵌套读取，不把 label 的屏障混给 class', () =>
  createRoot((dispose) => {
    const declaration = createPropsDeclaration(
      { class: '原值', label: undefined },
      { accumulate: pivPropAccumulation },
    )
    const view = {
      get class() {
        const value = declaration.peek.class
        declaration.peek.label
        return `${value}-转换`
      },
      get label() {
        return declaration.peek.label
      },
    }
    const upper = declaration.consume(view)
    const lower = mergePivProps({
      shadowProps: [{ class: '保留', label: '屏蔽' }, upper],
    })
    expect(val(lower.class)).toEqual(['保留', '原值-转换'])
    expect(val(lower.label)).toBeUndefined()
    dispose()
  }))

test('取得跨层稳定 Source 不求值上游 Source', () =>
  createRoot((dispose) => {
    const read = vi.fn(() => undefined)
    const upstream = createState(read, { lazy: true })
    const parent = createPropsDeclaration(
      { class: upstream },
      { accumulate: pivPropAccumulation },
    )
    const parentControl = createComponentPropsDirector(
      parent.peek,
      { class: 'state-source-view' },
      { declaration: parent },
    )
    const upper = parent.consume(parentControl.props)
    const child = createPropsDeclaration<{
      class?: Source<string | string[] | undefined>
      shadowProps: object[]
    }>(
      { shadowProps: [{ class: '低' }, upper] },
      { accumulate: pivPropAccumulation },
    )
    const childControl = createComponentPropsDirector(
      child.peek,
      { shadowProps: 'only-through-prop', class: 'state-source-view' },
      { declaration: child },
    )
    const lower = child.consume(childControl.props)
    const captured = Reflect.get(lower, 'class')
    expect(read).not.toHaveBeenCalled()
    expect(val(captured)).toEqual(['低', undefined])
    expect(read).toHaveBeenCalledTimes(1)
    dispose()
  }))
