/** Token 的基础内容、嵌套引用与特殊输出协议。 */
import { expect, test, vi } from 'vitest'
import { compileRules } from '../css-root'
import { token } from './core'
import { token as publicToken } from '../index'
import { add } from '../pieces/functions/calc'

test('聚合入口创建匿名直接值，编译为 CSS value 并暴露内部类别', () => {
  const size = publicToken('2px')
  expect(compileRules([[['.Direct'], 'width', size]])).toContain('width: 2px;')
  expect(size._kind).toBe('css-value')
})

test('直接值与仅有 default 的定义输出相同 CSS 内容，不制造变量声明', () => {
  const source = token('2px', 'same-input-source')
  const expression = add(source, '1px')
  const direct = token(expression)
  const definition = token({ default: expression })
  const compile = (content: ReturnType<typeof token>) =>
    compileRules([[['.Equivalent'], 'width', content]])
  expect(compile(definition)).toBe(compile(direct))
  expect(
    compileRules([[['.Primitive'], 'width', token({ default: '2px' })]]),
  ).toContain('width: 2px;')
  expect(
    compileRules([[['.Empty'], 'width', token({ default: undefined })]]),
  ).toBe('')
})

test('两种输入形式都延迟生产函数，并在消费位置输出相同结果', () => {
  const produce = vi.fn(() => '6px')
  const direct = token(produce)
  const definition = token({ default: produce })
  expect(produce).not.toHaveBeenCalled()
  const css = compileRules([
    [['.Producer'], 'width', direct],
    [['.Producer'], 'height', definition],
  ])
  expect(css).toContain('width: 6px;')
  expect(css).toContain('height: 6px;')
})

test('显式 default 保留对象数据和格式器，替换当前基础后输出新数据', () => {
  const source = { duration: 200, label: '基础数据' }
  const duration = token(
    { default: source },
    { toCSSString: (data) => `${data.duration}ms` },
  )
  expect(duration.default).toBe(source)
  expect(
    compileRules([[['.ObjectData'], 'transition-duration', duration]]),
  ).toContain('transition-duration: 200ms;')
  duration.default = { duration: 400, label: '替换数据' }
  expect(
    compileRules([[['.ObjectData'], 'transition-duration', duration]]),
  ).toContain('transition-duration: 400ms;')
})

test('嵌套 Token 不继承来源配置，来源仍按自己的根据地发布状态', () => {
  const activate = vi.fn(
    () => [[['.NestedResource'], 'opacity', 0.5]] as import('../rule').Rules,
  )
  const source = token('2px', {
    name: 'nested-source',
    address: '.Source',
    state: { '&[data-large]': '4px' },
    onFirstScan: activate,
  })
  const nested = token(source)
  expect(nested.default).toBe(source)
  expect(nested.state).toBeUndefined()
  expect(nested.address).toBeUndefined()
  expect(nested.name).toBeUndefined()
  const css = compileRules([[['.Target'], 'width', nested]])
  expect(css).toContain('width: var(--nested-source);')
  expect(css).toContain('--nested-source: 4px;')
  expect(css).toContain('.NestedResource')
  expect(activate).toHaveBeenCalledTimes(1)
})

test('特殊格式器读取已经编译的子内容，数值单位和输入替换保留', () => {
  const milliseconds = token(200, { toCSSString: (value) => `${value}ms` })
  expect(
    compileRules([[['.Duration'], 'transition-duration', milliseconds]]),
  ).toContain('transition-duration: 200ms;')
  milliseconds.default = 400
  expect(
    compileRules([[['.Duration'], 'transition-duration', milliseconds]]),
  ).toContain('transition-duration: 400ms;')
  const child = token('2px')
  const sequence = token(
    { default: [child, '3px'] },
    {
      dependencies: (items) => items,
      toCSSString: (items, resolve) => items.map(resolve).join(' '),
    },
  )
  expect(compileRules([[['.Sequence'], 'padding', sequence]])).toContain(
    'padding: 2px 3px;',
  )
})

test('命名 Token 的声明也采用特殊格式器，消费保持同一变量引用', () => {
  const duration = token(200, {
    name: 'formatted-duration',
    toCSSString: (value) => `${value}ms`,
  })
  const css = compileRules([[['.Formatted'], 'transition-duration', duration]])
  expect(css).toContain('--formatted-duration: 200ms;')
  expect(css).toContain('transition-duration: var(--formatted-duration);')
})

test('未消费内容不求值，合法共享完成而最终循环明确失败', () => {
  const source = vi.fn(() => 'red')
  const shared = token(source)
  expect(source).not.toHaveBeenCalled()
  expect(
    compileRules([
      [['.Shared'], 'color', shared],
      [['.Other'], 'color', shared],
    ]),
  ).toContain('color: red;')
  const cycle = token<import('./core').TokenData>({ default: undefined })
  cycle.default = cycle
  expect(() => compileRules([[['.Cycle'], 'color', cycle]])).toThrow('循环')
})
