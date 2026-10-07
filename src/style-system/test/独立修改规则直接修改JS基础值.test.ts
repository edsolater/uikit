/** 同一条规则的 JS 应用、目标隔离和后续样式消费。 */
import { expect, test } from 'vitest'
import { add, colorModification, createJSSContent, declare, key, modification, adjust, multiply, oklch, value, variable } from '../index'
import { compileRules } from '../css-root'
import type { Value } from '../value'
import type { OKLCHChannels } from '../index'
import type { Rules } from '../rule'

test('同一颜色规则连续修改目标，另一个共享来源及状态内容保持原值', () => {
  const shared = oklch({ lightness: 0.4, chroma: 0.1, hue: 120, alpha: 0.8 })
  const source = variable(shared, 'js-source')
  const target = variable(source, { name: 'js-target', states: { hover: oklch({ lightness: 0.9, chroma: 0.2, hue: 240 }) } })
  const other = variable(shared, 'js-other')
  const wrapped = variable(value(source), 'js-wrapped')
  const declarations: Rules = [[['.target'], ...declare(target)], [['.other'], ...declare(other)], [['.source'], ...declare(source)], [['.explicit'], ...declare(target, shared)], [['.wrapped'], ...declare(wrapped)]]
  expect(compileRules(declarations)).toContain('--js-source: oklch(0.4 0.1 120 / 0.8);')
  const change = colorModification({
    lightness: currentExpression => add(currentExpression, 0.1),
    chroma: currentExpression => multiply(currentExpression, 2), hue: 150,
    alpha: currentExpression => add(currentExpression, -0.2),
  })
  const adjusted = adjust(target, change)
  declarations.push([['.adjusted'], ...declare(adjusted)])
  adjust('mutable', target, change)
  adjust('mutable', target, change)
  adjust('mutable', wrapped, change)
  adjust('mutable', wrapped, change)
  const result = (target.config.defaultValue as Value<OKLCHChannels>).content
  expect(result.lightness).toBeCloseTo(0.6, 10)
  expect(result.chroma).toBeCloseTo(0.4, 10)
  expect(result.hue).toBe(150)
  expect(result.alpha).toBeCloseTo(0.4, 10)
  expect(shared.content).toEqual({ lightness: 0.4, chroma: 0.1, hue: 120, alpha: 0.8 })
  const css = compileRules(declarations)
  expect(css).toContain('--js-target: oklch(0.6 0.4 150 /')
  expect(css).toContain('--js-wrapped: oklch(0.6 0.4 150 /')
  expect(css).toContain('--js-other: oklch(0.4 0.1 120 / 0.8);')
  expect(css).toContain('--js-source: oklch(0.4 0.1 120 / 0.8);')
  expect(css).toContain(`${adjusted.toCSSString()}: oklch(0.5 0.2 150 /`)
  expect(css).toContain('--js-target: oklch(0.4 0.1 120 / 0.8);')
  expect(css).toContain('oklch(0.9 0.2 240)')
})

test('固定通道赋值不读取旧CSS表达式，省略通道和alpha保留数据含义', () => {
  const opaque = createJSSContent(() => 'var(--unknown)')
  const original = { lightness: opaque, chroma: 0.1, hue: 120 }
  const namedRule = { lightness: 0.6, description: '固定明度' }
  const fixed = colorModification(namedRule)
  const target = variable(oklch(original))
  adjust('mutable', target, fixed)
  expect((target.config.defaultValue as Value).content).toEqual({ lightness: 0.6, chroma: 0.1, hue: 120 })
  const alpha = variable(oklch(original))
  adjust('mutable', alpha, colorModification({ alpha: 1 }))
  expect((alpha.config.defaultValue as Value).content).toEqual({ ...original, alpha: 1 })
  const relative = colorModification({ lightness: currentExpression => add(currentExpression, 0.1) })
  expect(() => adjust('mutable', variable(oklch(original)), relative)).toThrow('JS 数值')
  const missingLightness = variable(oklch({ ...original, lightness: undefined }))
  expect(() => adjust('mutable', missingLightness, relative)).toThrow('JS 数值')
  adjust('mutable', missingLightness, fixed)
  expect((missingLightness.config.defaultValue as Value<OKLCHChannels>).content.lightness).toBe(0.6)
  const inherited = Object.create({ get lightness() { return 0.4 }, get chroma() { return 0.1 }, get hue() { return 120 }, get alpha() { return 0.8 } }) as OKLCHChannels
  const inheritedTarget = variable(oklch(inherited), 'inherited-js-color')
  adjust('mutable', inheritedTarget, fixed)
  expect(compileRules([[['.inherited'], ...declare(inheritedTarget)]])).toContain('--inherited-js-color: oklch(0.6 0.1 120 / 0.8);')
  expect(compileRules([[['.source'], ...declare(variable(oklch(inherited), 'inherited-js-source'))]])).toContain('--inherited-js-source: oklch(0.4 0.1 120 / 0.8);')
})

test('数值规则执行JS算术，后续编译读取新值、原格式与当前数据依赖', () => {
  const dependency = { onActive: (): Rules => [[['@font-face'], key('font-family'), 'MutationData']] }
  const target = variable(value(2, { toCSSString: number => String(number * 10), dependencies: number => number >= 7 ? [dependency] : [] }), 'js-number')
  const declarations: Rules = [[['.number'], ...declare(target)]]
  expect(compileRules(declarations)).not.toContain('MutationData')
  const change = modification(currentExpression => add(multiply(currentExpression, 3), 1))
  adjust('mutable', target, change)
  expect((target.config.defaultValue as Value<number>).content).toBe(7)
  const css = compileRules(declarations)
  expect(css).toContain('--js-number: 70;')
  expect(css).toContain('font-family: MutationData;')
  for (let index = 0; index < 1000; index++) adjust('mutable', target, modification(currentExpression => add(currentExpression, 1)))
  expect(compileRules(declarations)).toContain('--js-number: 10070;')
})

test('默认调整产生独立变量，保留格式、资源和已解析状态，配置容器互不影响', () => {
  let stateResolved = false
  const dependency = { onActive: (): Rules => [[['@font-face'], key('font-family'), 'AdjustedData']] }
  const source = variable(value(2, {
    toCSSString: number => String(number * 10),
    dependencies: number => number >= 3 ? [dependency] : [],
  }), {
    name: 'immutable-source',
    states: { hover: () => {
      if (stateResolved) throw new Error('调整不应重新求值状态回调')
      return 9
    } },
    registration: { syntax: '<number>', inherits: false, initialValue: 0 },
    onActive: (): Rules => [[['@counter-style adjusted-active'], key('system'), 'numeric']],
  })
  stateResolved = true
  source.name = `temp-${Number(variable(0).name.slice('temp-'.length)) + 1}`
  const adjusted = adjust(source, modification(currentExpression => add(currentExpression, 1)))
  expect(adjusted.toCSSString()).not.toBe(source.toCSSString())
  const declarations: Rules = [
    [['.source'], ...declare(source)], [['.source'], 'opacity', source],
    [['.adjusted'], ...declare(adjusted)], [['.adjusted'], 'opacity', adjusted],
  ]
  const css = compileRules(declarations)
  expect(css).toContain(`${source.toCSSString()}: 20;`)
  expect(css).toContain(`${adjusted.toCSSString()}: 30;`)
  expect(css).toContain(`${adjusted.toCSSString()}: 9;`)
  expect(css).toContain(`@property ${adjusted.toCSSString()}`)
  expect(css).toContain('font-family: AdjustedData;')
  expect(compileRules([[['.adjusted-only'], 'opacity', adjusted]])).toContain('@counter-style adjusted-active')
  adjusted.config.states.clear()
  adjusted.config.registration!.initialValue = 8
  const updatedCSS = compileRules(declarations)
  expect(updatedCSS).toContain(`${source.toCSSString()}: 9;`)
  expect(updatedCSS).not.toContain(`${adjusted.toCSSString()}: 9;`)
  expect(updatedCSS).toContain('initial-value: 0;')
  expect(updatedCSS).toContain('initial-value: 8;')
  const delayed = adjust(variable(2, { compileWaveIndex: 1 }), modification(currentExpression => add(currentExpression, 1)))
  expect(delayed.compileWaveIndex).toBe(1)
  expect(compileRules([[['.delayed'], ...declare(delayed)]])).toContain(`${delayed.toCSSString()}: 3;`)
})

test('两种调整模式在规则求值失败时均保留目标原内容', () => {
  const source = variable(oklch({ lightness: 0.4, chroma: 0.1, hue: 120 }), 'adjust-failure')
  const invalid = colorModification({ lightness: 0.6, chroma: () => createJSSContent(() => 'var(--unknown)') })
  expect(() => adjust(source, invalid)).toThrow('JS 数值')
  expect(() => adjust('mutable', source, invalid)).toThrow('JS 数值')
  expect(compileRules([[['.failure'], ...declare(source)]])).toContain('--adjust-failure: oklch(0.4 0.1 120);')
})

test('构造规则不执行回调，JS调整不执行CSS输出或生产函数', () => {
  const source = variable(() => { throw new Error('生产函数不应执行') }, 'js-producer')
  const change = colorModification({ lightness: () => { throw new Error('规则尚未应用') } })
  expect(() => adjust(source, change)).toThrow('不求值基础生产函数')
  expect(() => adjust('mutable', source, change)).toThrow('不求值基础生产函数')
  const target = variable(value(1, { toCSSString: () => { throw new Error('JS 调整不应调用 CSS 输出') } }), 'js-only')
  const direct = modification(currentExpression => add(currentExpression, 2))
  expect(() => adjust('mutable', target, direct)).not.toThrow()
  expect((target.config.defaultValue as Value).content).toBe(3)
})
