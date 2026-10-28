/** Token 的基础内容、嵌套引用与特殊输出协议。 */
import { stateCondition } from '../state-condition'
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

test('直接值与表达式按自身内容输出，不制造无必要的变量声明', () => {
  const source = token('2px', 'same-input-source')
  const direct = token(add(source, '1px'))
  expect(compileRules([[['.Expression'], 'width', direct]])).toContain(
    'width: calc(var(--same-input-source) + 1px);',
  )
  expect(compileRules([[['.Primitive'], 'width', token('2px')]])).toContain(
    'width: 2px;',
  )
  expect(compileRules([[['.Empty'], 'width', token(undefined)]])).toBe('')
})

test('内容生产函数延迟到消费位置执行', () => {
  const produce = vi.fn(() => '6px')
  const direct = token(produce)
  expect(produce).not.toHaveBeenCalled()
  expect(compileRules([[['.Producer'], 'width', direct]])).toContain(
    'width: 6px;',
  )
})

test('原始对象数据由显式格式器解释，替换当前基础后输出新数据', () => {
  const source = { duration: 200, label: '基础数据' }
  const duration = token(source, {
    toCSSString: (data) => `${data.duration}ms`,
  })
  expect(duration.default).toBe(source)
  expect(
    compileRules([[['.ObjectData'], 'transition-duration', duration]]),
  ).toContain('transition-duration: 200ms;')
  duration.default = { duration: 400, label: '替换数据' }
  expect(
    compileRules([[['.ObjectData'], 'transition-duration', duration]]),
  ).toContain('transition-duration: 400ms;')
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
  const sequence = token([child, '3px'], {
    dependencies: (items) => items,
    toCSSString: (items, resolve) => items.map(resolve).join(' '),
  })
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
  const cycle = token<import('./core').TokenData>(undefined)
  cycle.default = cycle
  expect(() => compileRules([[['.Cycle'], 'color', cycle]])).toThrow('循环')
})

test('继承根据地和注册定义，明确覆盖名称与默认值不改变来源', () => {
  const source = token(2, {
    name: 'from-registered',
    address: '.Source',
    registration: { syntax: '<number>', inherits: false, initialValue: 1 },
  })
  const copy = token(source, {
    name: source.name,
    address: '.Copy',
    default: 4,
  })
  const css = compileRules([
    [['.Source'], 'opacity', source],
    [['.Copy'], 'opacity', copy],
  ])
  expect(css).toContain('@property --from-registered')
  expect(css).toContain('syntax: "<number>";')
  expect(css).toContain('inherits: false;')
  expect(css).toMatch(/\.Source\s*\{[^}]*--from-registered: 2;/)
  expect(css).toMatch(/\.Copy\s*\{[^}]*--from-registered: 4;/)
  expect(copy).not.toBe(source)
})

test('同条件覆盖保持原位置，新条件追加，来源状态不变', () => {
  const local = stateCondition('&[data-local]')
  const source = token(1, {
    name: 'from-state-source',
    address: '.SourceState',
    state: [
      ['hover', 2],
      [local, 3],
    ],
  })
  const copy = token(source, {
    default: 1,
    name: 'from-state-copy',
    address: '.CopyState',
    state: [
      [stateCondition(local.header), 5],
      ['active', 6],
    ],
  })
  const css = compileRules([
    [['.SourceState'], 'opacity', source],
    [['.CopyState'], 'opacity', copy],
  ])
  expect(css).toContain('--from-state-source: 3;')
  expect(css).not.toContain('--from-state-source: 5;')
  for (const value of [1, 2, 5, 6])
    expect(css).toContain(`--from-state-copy: ${value};`)
  expect(css).not.toContain('--from-state-copy: 3;')
  expect(css.indexOf('--from-state-copy: 2;')).toBeLessThan(
    css.indexOf('--from-state-copy: 5;'),
  )
  expect(css.indexOf('--from-state-copy: 5;')).toBeLessThan(
    css.indexOf('--from-state-copy: 6;'),
  )
})

test('空状态覆盖保留来源，显式 undefined 清除状态和名称', () => {
  const source = token(1, { name: 'from-clear-source', state: { hover: 2 } })
  const inherited = token(source, { name: 'from-empty-state', state: {} })
  const cleared = token(source, {
    default: 1,
    name: undefined,
    state: undefined,
  })
  const css = compileRules([
    [['.Inherited'], 'opacity', inherited],
    [['.Cleared'], 'opacity', cleared],
  ])
  expect(css).toContain('--from-empty-state: 2;')
  expect(css).toMatch(/\.Cleared\s*\{\s*opacity: 1;/)
  expect(compileRules([[['.ClearedOnly'], 'opacity', cleared]])).not.toContain(
    'from-clear-source',
  )
})

test('追加的特殊输出方法由普通 Token 创建入口处理', () => {
  const part = token('7px', 'from-explicit-part')
  const copy = token(token(2), {
    name: 'from-explicit-output',
    default: { part },
    dependencies: (data) => [data.part],
    toCSSString: (data, resolve) => resolve(data.part),
  })
  const css = compileRules([[['.ExplicitOutput'], 'width', copy]])
  expect(css).toContain('--from-explicit-part: 7px;')
  expect(css).toContain('--from-explicit-output: var(--from-explicit-part);')
})

test('继承编译波和生命周期，并允许新定义覆盖回调', () => {
  const source = token('2px', {
    name: 'from-lifecycle-source',
    compileWaveIndex: 2,
    onFirstScan: () => [[['.InheritedResource'], 'display', 'block']],
    onCompile: (context, ast) => ast.setContent(context, '9px'),
  })
  const copy = token(source, { name: undefined })
  const inheritedCSS = compileRules([[['.LifecycleCopy'], 'width', copy]])
  expect(inheritedCSS).toContain('.InheritedResource')
  expect(inheritedCSS).toContain('width: 9px;')
  const overridden = token(source, {
    name: undefined,
    compileWaveIndex: undefined,
    onFirstScan: undefined,
    onCompile: (context, ast) => ast.setContent(context, '12px'),
  })
  const overriddenCSS = compileRules([
    [['.LifecycleOverride'], 'width', overridden],
  ])
  expect(overriddenCSS).not.toContain('.InheritedResource')
  expect(overriddenCSS).toContain('width: 12px;')
})

test('默认引用来源且自动使用独立名称，显式 default 保留真实类型', () => {
  const source = token('8px', { name: 'from-global-space' })
  const local = token(source, { address: '.LocalSpace' })
  const overridden = token(source, { default: 3 })
  // 返回类型跟随实际 default：默认是来源 Token，显式覆盖后是数值。
  const referenced: typeof source = local.default
  const scalar: number = overridden.default
  expect(referenced).toBe(source)
  expect(scalar).toBe(3)
  const css = compileRules([[['.LocalSpace'], 'width', local]])
  expect(css).toContain('--from-global-space: 8px;')
  const localName = css.match(/(--[\w-]+): var\(--from-global-space\);/)?.[1]
  expect(localName).toBeDefined()
  expect(localName).not.toBe('--from-global-space')
  expect(css).toContain('width: var(' + localName + ');')
  expect(css).not.toContain('--from-global-space: var(--from-global-space);')
})
