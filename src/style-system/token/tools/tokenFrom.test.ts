/** Token 定义继承的输出、状态合并和实例独立性。 */
import { expect, test } from 'vitest'
import { compileRules } from '../../css-root'
import { stateCondition } from '../../state-condition'
import { token } from '../core'
import { tokenFrom } from './tokenFrom'

test('继承根据地和注册定义，明确覆盖名称与默认值不改变来源', () => {
  const source = token(2, {
    name: 'from-registered',
    address: '.Source',
    registration: { syntax: '<number>', inherits: false, initialValue: 1 },
  })
  const copy = tokenFrom(source, {
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
  const copy = tokenFrom(source, {
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
  const inherited = tokenFrom(source, { name: 'from-empty-state', state: {} })
  const cleared = tokenFrom(source, {
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
  const copy = tokenFrom(token(2), {
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
  const copy = tokenFrom(source, { name: undefined })
  const inheritedCSS = compileRules([[['.LifecycleCopy'], 'width', copy]])
  expect(inheritedCSS).toContain('.InheritedResource')
  expect(inheritedCSS).toContain('width: 9px;')
  const overridden = tokenFrom(source, {
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
  const local = tokenFrom(source, { address: '.LocalSpace' })
  const overridden = tokenFrom(source, { default: 3 })
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
