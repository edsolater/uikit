/** 内部来源出口保留同一信号中的声明实体，不提前读取完成值。 */
import { createRoot, flush } from 'solid-js'
import { expect, test } from 'vitest'
import { createState } from './state'
import { val } from './read'
import { readStateSource } from './state-source'

test('内部来源保留惰性State、函数数据、Promise和显式undefined', async () => {
  let reads = 0
  let calls = 0
  const { state, lazy, dispose } = createRoot((dispose) => ({
    state: createState<unknown>(undefined, { lazy: true }),
    lazy: createState(
      () => {
        reads++
        return '惰性值'
      },
      { lazy: true },
    ),
    dispose,
  }))
  try {
    // 沿原惰性首写契约初始化直接State，再验证读取来源不启动结果层。
    expect(val(state)).toBeUndefined()
    state.set(lazy)
    flush()
    expect(readStateSource(state)).toBe(lazy)
    expect(reads).toBe(0)
    expect(val(state)).toBe('惰性值')
    const callback = () => {
      calls++
      return '函数值'
    }
    state.set(() => callback)
    flush()
    expect(readStateSource(state)).toBe(callback)
    expect(val(state)).toBe(callback)
    expect(calls).toBe(0)
    const pending = Promise.resolve('完成')
    state.set(pending)
    flush()
    expect(readStateSource(state)).toBe(pending)
    state.set(undefined)
    flush()
    expect(readStateSource(state)).toBeUndefined()
    expect(val(state)).toBeUndefined()
  } finally {
    dispose()
  }
})

test('原来源更新撤销临时写入后，内部仍取得原Source实体而非其当前undefined', () => {
  const scope = createRoot((dispose) => {
    const original = createState<string | undefined>('初值')
    return { original, state: createState(() => original), dispose }
  })
  try {
    scope.state.set('干预')
    flush()
    expect(val(scope.state)).toBe('干预')
    scope.original.set(undefined)
    flush()
    expect(readStateSource(scope.state)).toBe(scope.original)
    expect(val(scope.state)).toBeUndefined()
  } finally {
    scope.dispose()
  }
})
