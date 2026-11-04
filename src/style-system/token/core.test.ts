/** Token 的基础内容、嵌套引用与特殊输出协议。 */
import { stateCondition } from '../state-condition'
import { expect, test, vi } from 'vitest'
import { compileRules } from '../css-root'
import { token, createTokenDefinition } from './core'
import { token as publicToken } from '../index'
import { add } from '../pieces/functions/calc'
import { resolveTokenName } from './css'
import { createNewTokenGenerator } from './tools/createNewTokenGenerator'

test('仅对坍缩为变量的无名 Token 提示，并允许生成器关闭提示', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  try {
    const direct = token('2px')
    const missing = token('inherit', { state: { hover: 'hidden' } })
    const disabled = token('inherit', { state: { hover: 'hidden' }, $warnIfMissTokenName: false })
    const generated = createNewTokenGenerator({ prefixName: 'button' })('red', { state: { hover: 'blue' } })
    expect(generated.$warnIfMissTokenName).toBe(false)
    const css = compileRules([
      [['.Direct'], 'width', direct],
      [['.Missing'], 'visibility', missing],
      [['.Disabled'], 'visibility', disabled],
      [['.Generated'], 'color', generated],
    ])
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(expect.any(String), expect.stringMatching(/^--/), missing)
    expect(css).toContain(`var(--${resolveTokenName(missing)})`)
  } finally {
    warn.mockRestore()
  }
})

test('聚合入口创建匿名直接值，编译为 CSS value', () => {
  const size = publicToken('2px')
  expect(compileRules([[['.Direct'], 'width', size]])).toContain('width: 2px;')
})

test('显式名称属于当前定义，多级引用不累计来源，前缀仅补充名称', () => {
  const source = token('red', { name: 'brand-color' })
  const local = token(source, { name: 'local' })
  const nested = token(local, 'nested')
  const prefixed = createTokenDefinition(source, { name: 'local' }, 'button')
  expect(source.name).toBe('brand-color')
  expect(local.name).toBe('local')
  expect(prefixed.name).toBe('button-local')
  expect(nested.name).toBe('nested')
  const css = compileRules([
    [['.Local'], 'color', local],
    [['.Nested'], 'color', nested],
    [['.Prefixed'], 'color', prefixed],
  ])
  expect(css).toContain('--local: var(--brand-color);')
  expect(css).toContain('--nested: var(--local);')
  expect(css).toContain('--button-local: var(--brand-color);')
  expect(css).toContain('color: var(--local);')
  expect(css).toContain('color: var(--nested);')
  expect(css).toContain('color: var(--button-local);')
})

test('引用内容不继承来源名称，匿名来源仍保持纯值输出', () => {
  const source = token('2px')
  const reference = resolveTokenName(source)
  const local = token(source, { name: 'derived-spacing' })
  const css = compileRules([
    [['.Anonymous'], 'width', source],
    [['.Derived'], 'width', local],
  ])
  expect(css).toContain('width: 2px;')
  expect(css).toContain('--derived-spacing: 2px;')
  expect(css).toContain('width: var(--derived-spacing);')
  expect(resolveTokenName(source)).toBe(reference)
  expect(css).not.toContain(`--derived-spacing-${reference}`)
})

test('普通匿名值直接输出，引用创建保留表达式与独立身份', () => {
  const source = token('2px', 'same-input-source')
  const direct = token(add(source, '1px'), { name: 'expression-spacing' })
  expect(compileRules([[['.Expression'], 'width', direct]])).toContain(
    `--${direct.name}: calc(var(--same-input-source) + 1px);`,
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

test('显式命名不影响注册继承，覆盖基础值不改写来源', () => {
  const source = token(2, {
    name: 'from-registered',
    address: '.Source',
    registration: { syntax: '<number>', inherits: false, initialValue: 1 },
  })
  const copy = token(source, {
    name: 'local',
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
  expect(copy.name).toBe('local')
  expect(css).toMatch(/\.Copy\s*\{[^}]*--local: 4;/)
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
    expect(css).toContain(`--${copy.name}: ${value};`)
  expect(css).not.toContain(`--${copy.name}: 3;`)
  expect(css.indexOf(`--${copy.name}: 2;`)).toBeLessThan(
    css.indexOf(`--${copy.name}: 5;`),
  )
  expect(css.indexOf(`--${copy.name}: 5;`)).toBeLessThan(
    css.indexOf(`--${copy.name}: 6;`),
  )
})

test('空状态保留继承规则，清除状态不继承来源名称', () => {
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
  expect(inherited.name).toBe('from-empty-state')
  expect(css).toContain(`--${inherited.name}: 2;`)
  expect(cleared.name).toBeUndefined()
  expect(css).toContain('opacity: 1;')
  expect(compileRules([[['.ClearedOnly'], 'opacity', cleared]])).not.toContain(
    'var(--from-clear-source)',
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
  expect(css).toContain(`--${copy.name}: var(--from-explicit-part);`)
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

test('默认内容引用来源且没有同名自引用，显式 default 保留真实类型', () => {
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
