/** 验证公开默认属性合并保留空来源、动态默认来源和字段惰性读取。 */
import { createRoot, flush } from 'solid-js'
import { expect, test } from 'vitest'
import { createState, val } from '@/foundation'
import { addDefaultProps } from './defaultProps'

test('空默认来源不影响属性读取、成员判断和展开', () => {
  for (const defaults of [undefined, null, false]) {
    const props = addDefaultProps({ label: '实际值' }, defaults)
    expect(props.label).toBe('实际值')
    expect(Reflect.get(props, 'missing')).toBeUndefined()
    expect('missing' in props).toBe(false)
    expect(Object.hasOwn(props, 'missing')).toBe(false)
    expect({ ...props }).toEqual({ label: '实际值' })
  }
})

test('函数默认来源持续跟随响应式变化，也可以暂时为空', () => {
  const defaults = createState<{ label: string } | undefined>({
    label: '初始默认值',
  })
  const { props, dispose } = createRoot((dispose) => ({
    props: addDefaultProps({ label: undefined }, () => val(defaults)),
    dispose,
  }))
  expect(props.label).toBe('初始默认值')
  defaults.set({ label: '新的默认值' })
  flush()
  expect(props.label).toBe('新的默认值')
  defaults.set(undefined)
  flush()
  expect(props.label).toBeUndefined()
  expect({ ...props }).toEqual({ label: undefined })
  dispose()
})

test('优先使用显式值，undefined 才读取对应默认字段', () => {
  let defaultReads = 0
  const input: { label: string | undefined } = { label: '显式值' }
  const props = addDefaultProps(input, {
    get label() {
      defaultReads += 1
      return '默认值'
    },
  })
  expect(defaultReads).toBe(0)
  expect(props.label).toBe('显式值')
  expect(defaultReads).toBe(0)
  input.label = undefined
  expect(props.label).toBe('默认值')
  expect(defaultReads).toBe(1)
})
