/** 验证共享声明在正常层间交接中的消费权，不验证任意原对象访问隔离。 */
import { describe, expect, expectTypeOf, test } from 'vitest'
import { createRoot, flush } from 'solid-js'
import { createState, val } from '@/foundation'
import { createPropsDeclaration, hasPropDeclaration } from './shadowProps'
import { createInactivePlugin } from '../../plugins/tools/createInactivePlugin'
import { createPropsController } from '../propDefinition'
import { pivPropAccumulation } from '../../Piv/plugin/mergePivProps'

describe('逐层声明消费', () => {
  test('输入声明查询区分本层Controller写入，上层交付后仍是下层输入', () => {
    const { props, directed, dispose } = createRoot(dispose => {
      const declaration = createPropsDeclaration<{ disabled?: boolean }>({})
      const directed = createPropsController(declaration.resolvedProps, {
        disabled: 'source',
      })
      declaration.connectSupplementalProps(directed.props)
      const props = declaration.markUsedOnRead(directed.props)
      return { props, directed, dispose }
    })
    directed.states.disabled.set(true)
    flush()
    expect('disabled' in props).toBe(true)
    expect(hasPropDeclaration(props, 'disabled')).toBe(false)
    createRoot(dispose => {
      const child = createPropsDeclaration({
        shadowProps: props,
      }).markUsedOnRead()
      expect(hasPropDeclaration(child, 'disabled')).toBe(true)
      expect(hasPropDeclaration({ disabled: undefined }, 'disabled')).toBe(true)
      dispose()
    })
    dispose()
  })
  test('独立工具的显式 Props 泛型自动获得 shadowProps 与 is 入口', () =>
    createRoot(dispose => {
      type Props = { disabled?: boolean }
      const capability = createInactivePlugin<{}, {}, Props>({
        name: '类型化业务能力',
        pluginCore({ addProps }) {
          addProps({ disabled: true })
          return {}
        },
      })()
      const props = createPropsDeclaration<Props>({
        shadowProps: { disabled: false },
        is: capability,
      }).markUsedOnRead()
      expectTypeOf(props.disabled).toEqualTypeOf<boolean | undefined>()
      expect(props.disabled).toBe(true)
      dispose()
    }))
  test('本层重复读取保留，低优先级同名不复活，显式再交付形成新声明', () =>
    createRoot(dispose => {
      const parent = createPropsDeclaration({
        value: undefined,
        shadowProps: { value: '补充值' },
      }).markUsedOnRead()
      expect(parent.value).toBeUndefined()
      expect(parent.value).toBeUndefined()
      const child = createPropsDeclaration({
        shadowProps: parent,
      }).markUsedOnRead()
      expect('value' in child).toBe(false)
      expect(Reflect.get(child, 'value')).toBeUndefined()
      const explicit = createPropsDeclaration({
        value: parent.value,
        shadowProps: parent,
      }).markUsedOnRead()
      expect('value' in explicit).toBe(true)
      expect(explicit.value).toBeUndefined()
      dispose()
    }))

  test('子层先认领时父层不能再认领，同层重复取得同一 Source 且不提前求值', () =>
    createRoot(dispose => {
      let reads = 0
      const source = () => ++reads
      const parent = createPropsDeclaration({ value: source }).markUsedOnRead()
      const child = createPropsDeclaration({
        shadowProps: parent,
      }).markUsedOnRead()
      expect(Reflect.get(child, 'value')).toBe(source)
      expect(reads).toBe(0)
      expect(parent.value).toBeUndefined()
      expect('value' in parent).toBe(false)
      expect(Reflect.get(child, 'value')()).toBe(1)
      expect(Reflect.get(child, 'value')()).toBe(2)
      dispose()
    }))

  test('动态补充来源增删保留声明形状，不提前读取未消费 getter', () => {
    let unusedReads = 0
    const { declaration, child, dispose } = createRoot(dispose => {
      const declaration = createState<object>({ value: '初值' })
      const parent = createPropsDeclaration({
        get shadowProps() {
          return val(declaration)
        },
        get unused() {
          unusedReads++
          return '未用'
        },
      }).markUsedOnRead()
      const child = createPropsDeclaration({
        shadowProps: parent,
      }).markUsedOnRead()
      return { declaration, child, dispose }
    })
    expect('value' in child).toBe(true)
    expect(Reflect.get(child, 'value')).toBe('初值')
    declaration.set({ value: '新值', added: true })
    flush()
    expect(Reflect.get(child, 'value')).toBe('新值')
    expect(Reflect.get(child, 'added')).toBe(true)
    declaration.set({})
    flush()
    expect('value' in child).toBe(false)
    expect(unusedReads).toBe(0)
    dispose()
  })

  test('相同原始数据在独立实例中各自认领，不修改原始对象', () =>
    createRoot(dispose => {
      const input = { value: '共享' }
      const first = createPropsDeclaration(input).markUsedOnRead()
      const second = createPropsDeclaration(input).markUsedOnRead()
      expect(first.value).toBe('共享')
      expect(second.value).toBe('共享')
      expect(input.value).toBe('共享')
      dispose()
    }))

  test('显式覆盖不夺走未参与读取的上游声明', () =>
    createRoot(dispose => {
      const parent = createPropsDeclaration({ disabled: true }).markUsedOnRead()
      const child = createPropsDeclaration({
        disabled: false,
        shadowProps: parent,
      }).markUsedOnRead()
      expect(child.disabled).toBe(false)
      expect(parent.disabled).toBe(true)
      const grandchild = createPropsDeclaration({
        shadowProps: child,
      }).markUsedOnRead()
      expect('disabled' in grandchild).toBe(false)
      dispose()
    }))

  test('三层内部探测不认领上游字段', () =>
    createRoot(dispose => {
      const first = createPropsDeclaration({ value: true }).markUsedOnRead()
      const middle = createPropsDeclaration({
        shadowProps: first,
      }).markUsedOnRead()
      const last = createPropsDeclaration({ shadowProps: middle })
      expect(Reflect.get(last.resolvedProps, 'value')).toBe(true)
      expect(first.value).toBe(true)
      expect(Reflect.get(middle, 'value')).toBeUndefined()
      dispose()
    }))

  test('三层从高优先级上游认领，不误取尚未参与的低优先级上游', () =>
    createRoot(dispose => {
      const high = createPropsDeclaration({
        value: '高优先级',
      }).markUsedOnRead()
      const low = createPropsDeclaration({ value: '低优先级' }).markUsedOnRead()
      const middle = createPropsDeclaration({
        shadowProps: [low, high],
      }).markUsedOnRead()
      const last = createPropsDeclaration({
        shadowProps: middle,
      }).markUsedOnRead()
      expect(Reflect.get(last, 'value')).toBe('高优先级')
      expect(Reflect.get(last, 'value')).toBe('高优先级')
      expect(high.value).toBeUndefined()
      expect(low.value).toBe('低优先级')
      dispose()
    }))

  test('三层受控惰性 State 在取得时认领来源，延迟求值仍能使用自己的声明', () =>
    createRoot(dispose => {
      const first = createPropsDeclaration({ value: '来源' }).markUsedOnRead()
      const middleDeclaration = createPropsDeclaration<{
        value?: string
        shadowProps: typeof first
      }>({ shadowProps: first })
      const controlled = createPropsController(
        middleDeclaration.resolvedProps,
        {
          value: 'source',
          shadowProps: 'only-through-prop',
        },
      )
      middleDeclaration.connectSupplementalProps(controlled.props)
      const middle = middleDeclaration.markUsedOnRead(controlled.props)
      const last = createPropsDeclaration({
        shadowProps: middle,
      }).markUsedOnRead()
      const source = Reflect.get(last, 'value')
      expect(first.value).toBeUndefined()
      expect(Reflect.get(middle, 'value')).toBeUndefined()
      expect(val(source)).toBe('来源')
      dispose()
    }))

  test('累加字段被显式 undefined 截断时不读取或认领低优先级来源', () =>
    createRoot(dispose => {
      let reads = 0
      const parent = createPropsDeclaration(
        {
          get class() {
            reads++
            return '上游'
          },
        },
        {
          accumulate: pivPropAccumulation,
        },
      ).markUsedOnRead()
      const child = createPropsDeclaration(
        { class: undefined, shadowProps: parent },
        {
          accumulate: pivPropAccumulation,
        },
      ).markUsedOnRead()
      expect(child.class).toBeUndefined()
      expect(reads).toBe(0)
      expect(parent.class).toBe('上游')
      dispose()
    }))

  test('当前层逐项接入全部Plugin，字段交接不再次展开上层Plugin', () =>
    createRoot(dispose => {
      let builds = 0
      const capability = createInactivePlugin({
        name: '声明测试',
        pluginCore({ addProps }) {
          builds++
          addProps({ class: '能力声明' })
          return {}
        },
      })()
      const other = createInactivePlugin({
        name: '剩余能力',
        pluginCore({ addProps }) {
          addProps({ id: '剩余' })
          return {}
        },
      })()
      const parent = createPropsDeclaration({
        is: [capability, other],
      }).markUsedOnRead()
      const child = createPropsDeclaration({
        shadowProps: parent,
      }).markUsedOnRead()
      expect(Reflect.get(child, 'class')).toBe('能力声明')
      expect(Reflect.get(child, 'id')).toBe('剩余')
      expect('is' in child).toBe(false)
      expect(builds).toBe(1)
      dispose()
    }))
})

test('消费包装不更换补充来源，显式连接才接入处理后的动态容器', () => {
  createRoot(dispose => {
    for (const connect of [false, true]) {
      const declaration = createPropsDeclaration({ shadowProps: { value: 1 } })
      let containerReads = 0
      let valueReads = 0
      const processedProps = {
        get shadowProps() {
          containerReads++
          return {
            get value() {
              valueReads++
              return 2
            },
          }
        },
        get value() {
          return (declaration.resolvedProps as { value?: number }).value
        },
      }
      if (connect) declaration.connectSupplementalProps(processedProps)
      const props = declaration.markUsedOnRead(processedProps)
      expect(containerReads).toBe(connect ? 1 : 0)
      expect(valueReads).toBe(0)
      expect(props.value).toBe(connect ? 2 : 1)
    }
    dispose()
  })
})
