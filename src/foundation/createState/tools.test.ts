/** 验证默认值派生保留来源更新、完成值和准确类型。 */
import { createRoot, flush, NotReadyError, resolve } from 'solid-js'
import { expect, expectTypeOf, test } from 'vitest'
import { val } from './read'
import { createState } from './state'
import type { Source } from './source'
import { stateView, type StateView } from './state-view'
import { withDefault } from './tools'

test('来源为空时回默认值，更新后继续跟随且不吞 false、0 或空字符串', () => {
  const { source, view, dispose } = createRoot((dispose) => {
    const source = createState<string | number | boolean | null | undefined>(undefined)
    const view = withDefault(source, '默认')
    return { source, view, dispose }
  })
  expect(val(view)).toBe('默认')
  expect(val(source)).toBeUndefined()
  for (const value of [false, 0, '', '内容']) {
    source.set(value)
    flush()
    expect(val(view)).toBe(value)
  }
  source.set(null)
  flush()
  expect(val(view)).toBe('默认')
  source.set(undefined)
  flush()
  expect(val(view)).toBe('默认')
  dispose()
})

test('等待 Promise 完成后才对最终值应用默认，包括完成为 StateView 的来源', async () => {
  const deferred = Promise.withResolvers<undefined | StateView<undefined>>()
  const view = withDefault(deferred.promise, '完成默认')
  expect(view.read).toThrow(NotReadyError)
  deferred.resolve(stateView(undefined))
  await resolve(view.read)
  expect(val(view)).toBe('完成默认')
  const plain = withDefault(Promise.resolve(undefined), '默认')
  await resolve(plain.read)
  expect(val(plain)).toBe('默认')
})

test('从完整 Source 读取内容类型，默认字面量保持窄类型', () => {
  createRoot((dispose) => {
    const source = createState<'sm' | 'md' | 'lg' | undefined>(undefined)
    const options: { gap?: Source<'sm' | 'md' | 'lg' | undefined> } = { gap: source }
    const gap = withDefault(options.gap, 'md')
    expectTypeOf(gap).toEqualTypeOf<StateView<'sm' | 'md' | 'lg'>>()
    expectTypeOf(withDefault(undefined, 'top')).toEqualTypeOf<StateView<'top'>>()
    expect(val(gap)).toBe('md')
    dispose()
  })
})
