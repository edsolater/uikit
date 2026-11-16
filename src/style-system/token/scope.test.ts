/**
 * 实例 Token 写入作用域验证。
 *
 * 覆盖嵌套实例、异常退出和清除值，确认共享定义不承担实例状态。
 *
 * 不创建 DOM 或修改全局样式账本。
 */
import { expect, test } from 'vitest'
import { token } from './core'
import { collectTokenStyles } from './scope'

test('嵌套写入仅进入各自实例，离开作用域后不提供全局修改', () => {
  const gap = token('1rem', { name: 'scope-gap' })
  const outer = collectTokenStyles(() => {
    gap.set('2rem')
    const inner = collectTokenStyles(() => {
      gap.set('3rem')
    })
    expect(inner).toEqual({ '--scope-gap': '3rem' })
    gap.set('4rem')
  })
  expect(outer).toEqual({ '--scope-gap': '4rem' })
  expect(gap.default).toBe('1rem')
  expect(() => gap.set('5rem')).toThrow()
  expect(gap.default).toBe('1rem')
})

test('解释异常恢复上层实例，undefined只清除该实例本次覆盖', () => {
  const gap = token('1rem', { name: 'scope-clear-gap' })
  const failure = new Error('解释失败')
  const outer = collectTokenStyles(() => {
    gap.set('2rem')
    expect(() =>
      collectTokenStyles(() => {
        gap.set('3rem')
        throw failure
      }),
    ).toThrow(failure)
    gap.set(undefined)
  })
  expect(outer).toEqual({ '--scope-clear-gap': undefined })
  expect(collectTokenStyles(() => {})).toEqual({})
  expect(gap.default).toBe('1rem')
})
