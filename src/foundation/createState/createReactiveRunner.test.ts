import { flush, resolve, until, NotReadyError } from 'solid-js'
import { expect, expectTypeOf, test } from 'vitest'
import { createReactionFn } from './createReactiveRunner'
import { createState } from './state'

test('异步 runner 直接读取原生完成值与失败，不以局部 undefined 伪装结果', async () => {
  const request = Promise.withResolvers<number>()
  const runner = createReactionFn(() => request.promise)
  try {
    expectTypeOf(runner.getResult).returns.toEqualTypeOf<number>()
    expect(runner.getResult).toThrow(NotReadyError)
    request.resolve(7)
    await resolve(runner.getResult)
    expect(runner.getResult()).toBe(7)
  } finally { runner.dispose() }
  const failure = Promise.withResolvers<number>()
  const rejected = createReactionFn(() => failure.promise)
  try {
    const error = new Error('计算失败')
    const outcome = resolve(rejected.getResult)
    failure.reject(error)
    await expect(outcome).rejects.toBe(error)
    expect(rejected.getResult).toThrow('计算失败')
  } finally { rejected.dispose() }
})

test('动作在计算后执行且可写状态，旁读不订阅，释放同步清理并保留最后完成结果', async () => {
  const source = createState(1)
  const incidental = createState(0)
  const target = createState(0)
  const events: string[] = []
  const runner = createReactionFn(() => source.read() * 2, value => {
    incidental.read()
    target.set(value)
    events.push(`动作${value}`)
    return () => { events.push(`清理${value}`) }
  })
  try {
    await until(() => target.read() === 2)
    incidental.set(1)
    flush()
    expect(events).toEqual(['动作2'])
    source.set(2)
    await until(() => target.read() === 4)
    expect(events).toEqual(['动作2', '清理2', '动作4'])
    runner.dispose()
    expect(events).toEqual(['动作2', '清理2', '动作4', '清理4'])
    source.set(3)
    flush()
    expect(runner.getResult()).toBe(4)
    expect(target.read()).toBe(4)
    runner.dispose()
    expect(events).toHaveLength(4)
  } finally { runner.dispose() }
})

test('runner 归一裸 thenable 交付的内层 Promise', async () => {
  const thenable = { then(resolve: (value: Promise<number>) => unknown) { resolve(Promise.resolve(5)) } }
  const runner = createReactionFn(() => thenable)
  try {
    await resolve(runner.getResult)
    expect(runner.getResult()).toBe(5)
  } finally { runner.dispose() }
})
