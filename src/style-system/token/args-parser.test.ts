/** 验证基础内容与配置分界，状态组合只在参数入口归一。 */
import { expect, test, vi } from 'vitest'
import { parseTokenArgs } from './args-parser'
import { token } from './core'
import { resolveStateCondition } from '../state-condition-registry'
import { stateCondition } from '../state-condition'

const keys = [
  'default',
  'name',
  'state',
  'address',
  'registration',
  'onFirstScan',
  'compileWaveIndex',
].sort()

test('基础内容和配置形成七字段结果，缺省地址与名称不提前补齐', () => {
  for (const parsed of [
    parseTokenArgs(2),
    parseTokenArgs(2, 'amount'),
    parseTokenArgs(2, { state: { hover: 4 } }),
  ]) {
    expect(Object.keys(parsed).sort()).toEqual(keys)
    expect(parsed.default).toBe(2)
    expect(parsed.address).toBeUndefined()
    expect(parsed.compileWaveIndex).toBe(0)
  }
  expect(parseTokenArgs(2).state).toBeUndefined()
})

test('状态对象和任意嵌套容器统一展开，条件条目不会被拆开', () => {
  const local = stateCondition('&[data-local]')
  const source = { hover: 2 }
  const parsed = parseTokenArgs(1, {
    state: [source, [[new Map([['active', 3]])]], [local, 4], { hover: 5 }],
  })
  expect([...parsed.state!.values()]).toEqual([5, 3, 4])
  expect(parsed.state!.get(local)).toBe(4)
  expect(source).toEqual({ hover: 2 })
  expect(
    parseTokenArgs(1, { state: ['hover', 7] }).state!.get(
      resolveStateCondition('hover'),
    ),
  ).toBe(7)
})

test('StateCondition 同 header 的后项覆盖原位置，显式 undefined 不丢失', () => {
  const local = stateCondition('&[data-local]')
  const parsed = parseTokenArgs(1, {
    state: [
      [local, 2],
      { hover: 3 },
      [[stateCondition(local.header), undefined]],
      { active: 4 },
    ],
  })
  expect([...parsed.state!.values()]).toEqual([undefined, 3, 4])
  expect(parsed.state!.size).toBe(3)
})

test('对象和数组始终是原始数据，default 和 state 字段不作为定义解析', () => {
  const data = {
    duration: 200,
    default: '格式数据字段',
    state: { label: '数据内容' },
    hover: 4,
  }
  const values = [data, {}, ['2px', '4px'], []]
  for (const value of values) {
    const parsed = parseTokenArgs(value)
    expect(parsed.default).toBe(value)
    expect(parsed.state).toBeUndefined()
  }
  const formatted = token(data, {
    toCSSString: (value) => `${value.duration}ms`,
  })
  expect(formatted.default).toBe(data)
  expect(formatted.toCSSString()).toBe('200ms')
})

test.each(['2px', 0, false, null, undefined])(
  '无状态值 %s 原样保留',
  (value) => {
    const parsed = parseTokenArgs(value)
    expect(parsed.default).toBe(value)
    expect(parsed.state).toBeUndefined()
  },
)

test('所有状态组合入口拒绝未登记快捷名和直接 CSS 字符串', () => {
  for (const name of [
    'unknownParserShortcut',
    '&[data-unregistered]',
    '@media (width > 1px)',
  ]) {
    for (const state of [
      { [name]: 2 },
      [[name, 2]],
      new Map([[name, 2]]),
      [[{ [name]: 2 }]],
    ])
      expect(() => parseTokenArgs(1, { state: state as never })).toThrow(
        '未登记',
      )
  }
})

test('状态与基础生产器、生命周期及特殊格式在解析时都不执行', () => {
  const base = vi.fn(() => 2),
    hover = vi.fn(() => 4),
    onFirstScan = vi.fn(),
    onCompile = vi.fn(),
    toCSSString = vi.fn(() => '2')
  const parsed = parseTokenArgs(base, {
    state: [{ hover }],
    onFirstScan,
    onCompile,
    toCSSString,
    dependencies: [],
    compileWaveIndex: 3,
  })
  expect(parsed.default).toBe(base)
  expect(parsed.state!.get(resolveStateCondition('hover'))).toBe(hover)
  expect(parsed.onFirstScan).toBe(onFirstScan)
  expect(parsed.compileWaveIndex).toBe(3)
  for (const callback of [base, hover, onFirstScan, onCompile, toCSSString])
    expect(callback).not.toHaveBeenCalled()
})

if (false) {
  token({})
  token({ size: '2px' })
  token(['2px', '4px'])
  token<{ duration: number }>(
    { duration: 200 },
    { toCSSString: (value) => `${value.duration}ms` },
  )
  // @ts-expect-error 内容生产器不产生未经表达的普通对象。
  token(() => ({ size: '2px' }))
  // @ts-expect-error 内容生产器不产生 false。
  token(() => false)
  // @ts-expect-error 内容生产器不产生 null。
  token(() => null)
  // @ts-expect-error 状态规则不把 false 作为可编译状态值。
  token(false, { state: { hover: false } })
}
