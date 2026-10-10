/**
 * 本文件验证 Source 输入协议的类型关系。
 * 它不测试 val 的最终读取行为和 stateView 的转换实现。
 */
import type { MayArray } from '@edsolater/fnkit'
import { expectTypeOf, test } from 'vitest'
import type { MayArraySource, Source } from './source'

test('Source 接受普通值', () => {
  expectTypeOf<number[]>().toExtend<Source<number[]>>()
  expectTypeOf<{ id: string }[]>().toExtend<Source<{ id: string }[]>>()
  expectTypeOf<{ id: string }>().toExtend<Source<{ id: string }>>()
})

test('PromiseLike 只能直接成为允许 undefined 的 Source', () => {
  expectTypeOf<Promise<number>>().not.toExtend<Source<number>>()
  expectTypeOf<Promise<number>>().toExtend<Source<number | undefined>>()
})

test('MayArraySource 自身包含外层 Source', () => {
  expectTypeOf<MayArraySource<number>>().toEqualTypeOf<
    Source<MayArray<Source<number> | undefined>>
  >()
})
