/** 验证基础色、绝对通道、独立增量与 JSS 生命周期。 */
import { afterEach, expect, test, vi } from 'vitest'
import { colorVariable } from './color-variable'
import { compileCSS } from './css-root'
import { rules, type Rules, type RulesHandle } from './rule'
import { key } from './key'
import { variable } from './variable'
import { condition } from './condition'
import { stateCondition } from './pieces/state-conditions'
import { value } from './value'
import { compileRules } from './css-root'
import { actionColor } from './pieces/contents/atoms/color/action'

const handles: RulesHandle[] = []
afterEach(() => handles.splice(0).forEach((handle) => handle.remove()))

test('初始声明仅有基础色和主色，通道与增量只作为 CSS 回退', () => {
  const color = colorVariable(undefined, { name: 'initial-color' })
  handles.push(rules('.InitialColor', color.declare()))
  const css = compileCSS()
  expect(css).toContain('--initial-color-base: black;')
  expect(css).toContain('--initial-color: oklch(from var(--initial-color-base, black)')
  expect(css).toContain('calc(var(--initial-color-lightness, l) + var(--initial-color-delta-lightness, 0))')
  expect(css).toContain('calc(var(--initial-color-alpha, alpha) + var(--initial-color-delta-alpha, 0))')
  expect(css).not.toMatch(/--initial-color-(?:lightness|chroma|hue|alpha|delta-\w+):/)
})

test('declare 只换基础色，不清空已经设置的通道与增量', () => {
  const color = colorVariable('red', { name: 'combined-color' })
  handles.push(rules('.CombinedColor', [color.setLightness(0.5), color.deltaLightness(0.1), color.declare('blue')]))
  const css = compileCSS()
  expect(css).toContain('--combined-color-base: blue;')
  expect(css).toContain('--combined-color-lightness: 0.5;')
  expect(css).toContain('--combined-color-delta-lightness: 0.1;')
  expect(css.match(/--combined-color: oklch\(/g)).toHaveLength(1)
})

test('重复绝对和增量字段分别采用最后有效值，不累加调用或形成逗号列表', () => {
  const color = colorVariable('black', { name: 'last-color' })
  handles.push(rules('.LastColor', [color.setAlpha(0.8), color.setAlpha(0.6), color.setAlpha(undefined),
    color.deltaAlpha(0.2), color.deltaAlpha(-0.1)]))
  const css = compileCSS()
  expect(css).toContain('--last-color-alpha: 0.6;')
  expect(css).toContain('--last-color-delta-alpha: -0.1;')
  expect(css).not.toContain('--last-color-alpha: 0.8,')
})

test('通道改名在消费时解析，增量仍是独立字段', () => {
  const color = colorVariable('black', { name: 'rename-color' })
  const declaration = color.setHue(120)
  color.hue.name = 'late-hue'
  handles.push(rules('.RenameColor', [declaration, color.deltaHue(30)]))
  const css = compileCSS()
  expect(css).toContain('--late-hue: 120;')
  expect(css).toContain('calc(var(--late-hue, h) + var(--rename-color-delta-hue, 0))')
})

test('整体动态来源保留原 Variable 状态及按需注册，不提前读取颜色', () => {
  const target = colorVariable('black', { name: 'action-target' })
  handles.push(rules('.ActionTarget', target.declare(actionColor)))
  const css = compileCSS()
  expect(css).toContain('--action-target-base: var(--action-color, var(--color-action));')
  expect(css).toContain('--color-action-hover')
  expect(css).toContain('@property --action-color')
})

test('另一 ColorVariable 作为完整颜色来源，不转接通道或基础色身份', () => {
  const source = colorVariable('red', { name: 'full-source' })
  const target = colorVariable('black', { name: 'full-target' })
  handles.push(rules('.FullTarget', target.declare(source)))
  expect(compileCSS()).toContain('--full-target-base: var(--full-source, oklch(')
  expect(compileCSS()).not.toContain('--full-target-lightness:')
})

test.each(['declare', 'set', 'delta'] as const)('仅%s仍激活目标注册和资源，移除后清理', (mode) => {
  const activated = vi.fn(() => [[[{ header: '.OwnResource' }], key('opacity'), 0.4]] as Rules)
  const color = colorVariable('black', { name: 'resource-color', onActive: activated,
    registration: { syntax: '<color>', inherits: true, initialValue: 'black' } })
  const declaration = mode === 'declare' ? color.declare() : mode === 'set' ? color.setAlpha(0.6) : color.deltaAlpha(-0.1)
  const handle = rules('.OwnConsumer', declaration)
  handles.push(handle)
  const css = compileCSS()
  expect(css).toContain('@property --resource-color')
  expect(css).toContain('.OwnResource')
  expect(activated).toHaveBeenCalledTimes(1)
  handle.remove()
  expect(compileCSS()).not.toContain('@property --resource-color')
  expect(compileCSS()).not.toContain('.OwnResource')
})

test.each(['declare', 'set', 'delta'] as const)('同一%s声明复用于两处，每个地址均发布主色', (mode) => {
  const color = colorVariable('black', { name: 'reused-color' })
  const declaration = mode === 'declare' ? color.declare('red') : mode === 'set' ? color.setAlpha(0.6) : color.deltaAlpha(-0.1)
  handles.push(rules('.First', declaration), rules('.Second', declaration))
  expect(compileCSS().match(/--reused-color: oklch\(/g)).toHaveLength(2)
})

test('延后增量保留 JSS 编译波次和资源，移除后清理', () => {
  const activated = vi.fn(() => [[[{ header: '.DelayedResource' }], key('opacity'), 0.4]] as Rules)
  const compiled = vi.fn(() => 0.1)
  const content = { onCompile: compiled, onActive: activated, compileWaveIndex: 2 }
  const color = colorVariable('black', { name: 'delayed-color' })
  const declaration = color.deltaLightness(content)
  expect(compiled).not.toHaveBeenCalled()
  const handle = rules('.Delayed', declaration)
  handles.push(handle)
  expect(compileCSS()).toContain('--delayed-color-delta-lightness: 0.1;')
  expect(activated).toHaveBeenCalledTimes(1)
  expect(compiled).toHaveBeenCalledTimes(1)
  handle.remove()
  expect(compileCSS()).not.toContain('.DelayedResource')
})

test('直接同名来源被拒绝，不生成基础色自循环', () => {
  const color = colorVariable('black', { name: 'collision-color' })
  expect(() => color.declare(variable('red', { name: 'collision-color-base' }))).toThrow('基础色或通道名称')
  expect(() => color.declare(variable('red', { name: color.alpha.name }))).toThrow('基础色或通道名称')
  expect(() => color.declare(colorVariable('red', { name: 'collision-color' }))).toThrow('基础色或通道名称')
  handles.push(rules('.Self', color.declare(color)))
  expect(compileCSS()).not.toContain('--collision-color-base: var(--collision-color')
})


test('私有聚合与普通按需声明同址时，末激活资源完整替换而非逗号混合', () => {
  const color = colorVariable('red', { name: 'resource-address-color' })
  const later = value('black', { onActive: () => [[['.ResourceAddress'], color, 'blue']] })
  const css = compileRules([[['.ResourceAddress'], 'background-color', color], [['.ResourceAddress'], 'color', later]])
  expect(css).toContain('--resource-address-color: blue;')
  expect(css).not.toContain('--resource-address-color: oklch(')
  expect(css).not.toContain(', blue;')
})

test('同名不同颜色的末激活聚合完整接管同址定义', () => {
  const red = colorVariable('red', { name: 'replacement-color' })
  const blue = colorVariable('blue', { name: 'replacement-color' })
  const css = compileRules([[['.Replacement'], 'background-color', red], [['.Replacement'], 'color', blue]])
  expect(css.match(/--replacement-color: oklch/g)).toHaveLength(1)
  expect(css).toContain('var(--replacement-color-base, blue)')
  expect(css.match(/--replacement-color: ([^;]+);/)?.[1]).not.toContain('var(--replacement-color-base, red)')
})

test('相同 CSS 条件的不同状态资源保留各自状态与语义身份', () => {
  stateCondition('resourceAliasA', condition('&[data-resource-alias]'))
  stateCondition('resourceAliasB', condition('&[data-resource-alias]'))
  const color = colorVariable('red', { name: 'state-resource-color' })
  const source = variable('black', { name: 'state-resource-source', states: { resourceAliasA: color, resourceAliasB: color } })
  const observed: string[][] = []
  const css = compileRules([
    [['.StateResource'], 'color', source],
    [[], 'order', { compileWaveIndex: 2, onCompile(_, ast) {
      const nodes = ast.search({ key: color }).filter(node => node.resourceAddress !== undefined)
      observed.push(...nodes.map(node => node.conditionPath.stateConditionPath.map(state => state.name)))
      expect(nodes.map(node => node.conditionPath.semanticPath?.at(-1))).toEqual(['resourceAliasA', 'resourceAliasB'])
      return 1
    } }],
  ])
  expect(observed).toEqual([['resourceAliasA'], ['resourceAliasB']])
  expect(css).toContain('--state-resource-color: oklch(')
})


test.each([true, false])('同址共享聚合撤销一个消费者保留另一，最后消费者存活=%s', (keepLast) => {
  const color = colorVariable('red', { name: 'shared-owner-color' })
  const css = compileRules([
    [['.SharedOwner'], 'background-color', color],
    [['.SharedOwner'], 'color', color],
    [[], 'order', { compileWaveIndex: 2, onCompile(_, ast) {
      ast.remove(ast.search({ key: 'background-color' })[0])
      if (!keepLast) ast.remove(ast.search({ key: 'color' })[0])
      return undefined
    } }],
  ])
  expect(css.includes('--shared-owner-color: oklch(')).toBe(keepLast)
  if (keepLast) expect(css.match(/--shared-owner-color: oklch/g)).toHaveLength(1)
})
