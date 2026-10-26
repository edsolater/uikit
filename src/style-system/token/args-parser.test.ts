/** 验证 Token 创建参数归一为公开七字段，不执行内容。 */
import { expect, test, vi } from 'vitest'
import { parseTokenArgs } from './args-parser'
import { token, type TokenData } from './core'

const keys = [
  'default',
  'name',
  'state',
  'address',
  'registration',
  'onFirstScan',
  'compileWaveIndex',
].sort()

test('五种创建写法使用同一七字段结果，缺省地址和名称不提前补齐', () => {
  const inputs = [
    parseTokenArgs(2, 'amount'),
    parseTokenArgs(2),
    parseTokenArgs({ default: 2 }),
    parseTokenArgs({ default: 2, hover: 4 }),
    parseTokenArgs(2, { name: 'amount', state: { hover: 4 } }),
  ]
  for (const parsed of inputs) {
    expect(Object.keys(parsed).sort()).toEqual(keys)
    expect(parsed.default).toBe(2)
    expect(parsed.address).toBeUndefined()
    expect(parsed.compileWaveIndex).toBe(0)
  }
  expect(inputs[1].name).toBeUndefined()
  expect(inputs[1].state).toBeUndefined()
  expect(inputs[2].state).toBeUndefined()
  expect(inputs[3].state).toEqual(inputs[4].state)
})

test.each(['2px', 0, false, null, undefined])(
  '无状态值 %s 的直接输入与 default 定义归一等价',
  (value) => {
    const direct = parseTokenArgs(value)
    const definition = parseTokenArgs({ default: value })
    expect(definition).toEqual(direct)
    expect(definition.state).toBeUndefined()
  },
)

test('default 中的格式数据保留原对象，不再解析它自己的字段', () => {
  const data = {
    duration: 200,
    default: '格式数据字段',
    state: { label: '数据内容' },
  }
  const parsed = parseTokenArgs({ default: data })
  expect(parsed.default).toBe(data)
  expect(parsed.state).toBeUndefined()
  expect(parsed.name).toBeUndefined()
  expect(parseTokenArgs({ default: undefined }).default).toBeUndefined()
})

test('可坍缩协议对象和延迟生产器继续作为直接值，不按普通定义对象拆解', () => {
  const output = vi.fn(() => '4px')
  const expression = { default: '内部数据', toCSSString: output }
  const producer = vi.fn(() => expression)
  expect(parseTokenArgs(expression).default).toBe(expression)
  expect(parseTokenArgs(producer).default).toBe(producer)
  expect(parseTokenArgs({ default: producer }).default).toBe(producer)
  expect(output).not.toHaveBeenCalled()
  expect(producer).not.toHaveBeenCalled()
})

test.each(
  [{ size: '2px' }, { hover: '4px' }, [], [1, 2]].map((input) => ({ input })),
)('普通裸数据 $input 在参数入口拒绝，要求明确 default', ({ input }) => {
  expect(() => parseTokenArgs(input as never)).toThrow('default')
  expect(() => token(input as never)).toThrow('default')
})

if (false) {
  // @ts-expect-error 空对象不具备实际内容协议，也没有定义 default。
  token({})
  // @ts-expect-error 普通数据对象必须放进定义的 default。
  token({ size: '2px' })
  // @ts-expect-error 数组数据必须放进定义的 default。
  token(['2px', '4px'])
  // @ts-expect-error 宽泛数据泛型不能重新放开裸对象。
  token<TokenData>({ size: '2px' })
  // @ts-expect-error 宽泛数据泛型不能重新放开裸数组。
  token<TokenData>(['2px'])
  // @ts-expect-error 定义中的生产器也只能返回内容链可消费的输入。
  token({ default: () => false })
  // @ts-expect-error null 不新增为生产器返回值。
  token({ default: () => null })
  // @ts-expect-error 生产器不能通过 default 返回未经内容协议表达的裸对象。
  token({ default: () => ({ size: '2px' }) })
  // @ts-expect-error 简写固定状态与显式 state 使用同一内容契约。
  token({ default: false, hover: false })
  // @ts-expect-error 显式状态同样不把 false 承诺为可编译状态值。
  token(false, { state: { hover: false } })
  // @ts-expect-error 直接生产器不能返回内容链拒绝的 false。
  token(() => false)
  // @ts-expect-error 直接生产器同样不新增 null 返回能力。
  token(() => null)
  // @ts-expect-error 直接生产器不能返回普通数据对象。
  token(() => ({ size: '2px' }))

  const data = { duration: 200 }
  // @ts-expect-error 基础数据的 formatter 不自动赋予状态普通对象相同的内容能力。
  token(
    { default: data, hover: data },
    { toCSSString: (value) => `${value.duration}ms` },
  )
  token({ default: data }, { toCSSString: (value) => `${value.duration}ms` })
  token({ default: ['2px', '4px'] })
  type Duration = { duration: number }
  token<Duration>(
    { default: { duration: 200 }, hover: '400ms' },
    { toCSSString: (value) => `${value.duration}ms` },
  )
  token<Duration>(
    { default: { duration: 200 } },
    {
      state: { hover: '400ms' },
      toCSSString: (value) => `${value.duration}ms`,
    },
  )
  parseTokenArgs(2).default.toFixed()
  const protocolWithDefault = { default: '内部数据', toCSSString: () => '4px' }
  token(protocolWithDefault).default.toCSSString()
  parseTokenArgs(protocolWithDefault).default.toCSSString()

  class Output {
    toCSSString() {
      return '2px'
    }
  }
  class InheritedOutput extends Output {}
  const callable = Object.assign(() => '未调用的函数体', {
    toCSSString: () => '4px',
  })
  token(new InheritedOutput())
  token(callable)
  token(() => token('2px'))
}

test('配置状态覆盖简写同名项，显式 undefined 保留且不修改输入', () => {
  const input = { default: undefined, hover: 2, active: 3 }
  const state = { hover: undefined, focus: 4 }
  expect(parseTokenArgs(input, { state })).toMatchObject({
    default: undefined,
    state: { hover: undefined, active: 3, focus: 4 },
  })
  expect(input).toEqual({ default: undefined, hover: 2, active: 3 })
  expect(state).toEqual({ hover: undefined, focus: 4 })
})

test('特殊协议方法不进入七字段，基础与状态回调不提前执行', () => {
  const base = vi.fn(() => 2),
    hover = vi.fn(() => 4),
    onFirstScan = vi.fn(),
    onCompile = vi.fn()
  const parsed = parseTokenArgs(
    { default: base, hover },
    {
      onFirstScan,
      onCompile,
      dependencies: [],
      toCSSString: () => '2',
      compileWaveIndex: 3,
    },
  )
  expect(Object.keys(parsed).sort()).toEqual(keys)
  expect(parsed.default).toBe(base)
  expect(parsed.state?.hover).toBe(hover)
  expect(parsed.onFirstScan).toBe(onFirstScan)
  expect(parsed.compileWaveIndex).toBe(3)
  expect(base).not.toHaveBeenCalled()
  expect(hover).not.toHaveBeenCalled()
})

test('嵌套 Token 是完整表达式引用，不被误认为 default 状态简写', () => {
  const source = token(2, {
    name: 'source',
    address: '.Source',
    state: { hover: 4 },
    registration: { syntax: '<number>', inherits: false, initialValue: 1 },
  })
  const nested = parseTokenArgs(source)
  expect(nested.default).toBe(source)
  expect(nested.name).toBeUndefined()
  expect(nested.state).toBeUndefined()
  expect(nested.address).toBeUndefined()
  expect(nested.registration).toBeUndefined()
})
