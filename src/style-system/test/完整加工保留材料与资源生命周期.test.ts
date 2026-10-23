/** 完整加工的材料、共享资源与退出效果验证。

核对配方转译、共享依赖、结构协议和生命周期的实际 CSS。

完整状态与变体结果由浏览器流程测试验证，不约束共同声明的数量或位置。
*/
import { expect, test } from 'vitest'
import { add } from '../pieces/contents/functions/calc'
import { adjust } from '../operations/adjust'
import { declare, type Declaration } from '../operations/declare'
import { key } from '../key'
import { modification, type Modification } from '../modification'
import { modify } from '../operations/modify'
import { oklch } from '../pieces/contents/functions/oklch'
import { value } from '../value'
import { variable } from '../variable'
import * as variables from '../variable'
import type { Rules } from '../rule'
import { compileRules } from '../css-root'

/**
 * 将一组公开声明放在同一作用域编译。
 */
const compile = (...entries: Declaration[]): string => compileRules(entries.map(entry => [['.Binding'], ...entry]))

test('不同描述可独立声明，颜色配方可直接引用且不绑定某个来源', () => {
  const change = modification({ name: '--change', type: 'color', detail: { lightness: 0.3, chroma: x => add(x, 0.3) } })
  const css = compile(declare(change), [key('--reference'), change])
  expect(css).toContain('--change: 0.3 calc(c + 0.3) h / alpha;')
  expect(css).toContain('--reference: var(--change);')
  const targetKey = key('--generic-description')
  const generic: Modification<number, 'number'> = { ...targetKey, key: targetKey, name: targetKey.toCSSString(), type: 'number', detail: 5, content: 5 }
  expect(compile(declare(generic))).toContain('--generic-description: 5;')
})

test('不同来源可共享配方，直接使用结果即可取得完整加工表达式', () => {
  const first = variable(oklch({ lightness: 0.5, chroma: 0.1, hue: 240 }), 'source-first')
  const second = variable('red', 'source-second')
  const change = modification({ name: '--shared-change', type: 'color', detail: { lightness: 0.3 } })
  const firstResult = adjust(first, change), secondResult = adjust(second, change)
  const css = compileRules([[['.First'], 'color', firstResult], [['.Second'], 'color', secondResult]])
  expect(css).toContain('--shared-change: 0.3 c h / alpha;')
  expect(css).toContain(`${firstResult.toCSSString()}: oklch(from var(--source-first) var(--shared-change));`)
  expect(css).toContain(`${secondResult.toCSSString()}: oklch(from var(--source-second) var(--shared-change));`)
  expect(compileRules([[['.Source'], 'color', second]])).toContain('--source-second: red;')
})

test('撤销一个消费者保留共享资源，全部撤销后释放自动资源', () => {
  for (const removeAll of [false, true]) {
    const source = { key: key('--owned-source'), content: value('red', { onActive: (): Rules => [[['.BindingResource'], 'opacity', 0.5]] }), registration: { syntax: '<color>', inherits: true, initialValue: 'black' } }
    const change = { type: 'color' as const, key: key('--owned-change'), content: 'l c h / 0.5', onActive: (): Rules => [[['.ChangeResource'], 'opacity', 0.5]] }
    const first = adjust(source, change), second = adjust(source, change)
    const consumerKeys = [key('color'), key('background-color')]
    const css = compileRules([
      [['.Binding'], consumerKeys[0], first], [['.Binding'], consumerKeys[1], second],
      [[], 'order', { compileWaveIndex: 2, onCompile(context, controller) {
        for (const consumerKey of consumerKeys.slice(0, removeAll ? 2 : 1)) {
          for (const node of controller.search({ key: consumerKey })) controller.remove(node)
        }
        controller.setContent(context, 1)
      } }],
    ])
    expect(css.includes('--owned-change:')).toBe(!removeAll)
    expect(css.includes('.BindingResource')).toBe(!removeAll)
    expect(css.includes('@property --owned-source')).toBe(!removeAll)
    expect(css.includes('.ChangeResource')).toBe(!removeAll)
  }
})

test.each(['天然材料', 'Variable'])('调整保留%s来源的顶层资源，并随结果消费退出', kind => {
  for (const removeAll of [false, true]) {
    const onActive = (): Rules => [[['.SourceTopResource'], 'opacity', 0.5]]
    const registration = { syntax: '<color>', inherits: false, initialValue: 'black' }
    const source = kind === '天然材料'
      ? { key: key('--top-resource-source'), content: 'red', onActive, registration }
      : variable('red', { name: 'top-resource-source', onActive, registration })
    const change = modification({ type: 'color', detail: { alpha: 0.5 } })
    const first = adjust(source, change), second = adjust(source, change)
    const consumerKeys = [key('color'), key('background-color')]
    const css = compileRules([
      [['.ResourceConsumer'], consumerKeys[0], first], [['.ResourceConsumer'], consumerKeys[1], second],
      [[], 'order', { compileWaveIndex: 2, onCompile(context, controller) {
        for (const consumerKey of consumerKeys.slice(0, removeAll ? 2 : 1)) {
          for (const node of controller.search({ key: consumerKey })) controller.remove(node)
        }
        controller.setContent(context, 1)
      } }],
    ])
    expect(css.includes('.SourceTopResource')).toBe(!removeAll)
    expect(css.includes('@property --top-resource-source')).toBe(!removeAll)
    expect(css).not.toContain(`@property ${second.toCSSString()}`)
    if (!removeAll) {
      expect(css).toContain('syntax: "<color>";')
      expect(css).toContain('inherits: false;')
      expect(css).toContain('initial-value: black;')
    }
  }
})

test('仅消费调整结果的多个变体仍保留来源资源，最后退出时释放', () => {
  for (const removeAll of [false, true]) {
    const source = variable('red', {
      name: 'variant-resource-source', variants: { line: 'blue', content: 'green' },
      registration: { syntax: '<color>', inherits: false, initialValue: 'black' },
      onActive: (): Rules => [[['.VariantOnlyResource'], 'opacity', 0.5]],
    })
    const adjusted = adjust(source, modification({ type: 'color', detail: { alpha: 0.5 } }))
    const line = adjusted.variant('line'), content = adjusted.variant('content')
    const consumerKeys = [key('color'), key('background-color')]
    const css = compileRules([
      [['.VariantResource'], consumerKeys[0], line], [['.VariantResource'], consumerKeys[1], content],
      [[], 'order', { compileWaveIndex: 2, onCompile(context, controller) {
        for (const consumerKey of consumerKeys.slice(0, removeAll ? 2 : 1)) {
          for (const node of controller.search({ key: consumerKey })) controller.remove(node)
        }
        controller.setContent(context, 1)
      } }],
    ])
    expect(css.includes('.VariantOnlyResource')).toBe(!removeAll)
    expect(css.includes('@property --variant-resource-source')).toBe(!removeAll)
    expect(css).not.toContain(`@property ${line.toCSSString()}`)
    expect(css).not.toContain(`@property ${content.toCSSString()}`)
  }
})

test.each(['天然材料', 'Variable'])('匿名结果避让来源和配方名称，%s不需要补声明', mode => {
  const source = mode === '天然材料' ? { key: key('--binding-source'), content: 'red' } : variable('red', { name: variables.variableName('binding-source') })
  const change = modification({ type: 'color', name: '--initial-change', detail: { alpha: 0.5 } })
  change.name = '--renamed-change'
  const merged = adjust(source, change)
  const css = compileRules([[['.Binding'], 'color', merged]])
  const names = [source.key.toCSSString(), change.toCSSString(), merged.toCSSString()]
  expect(new Set(names).size).toBe(3)
  expect(css).toContain(`${merged.toCSSString()}: oklch(from var(--binding-source) var(--renamed-change));`)
  expect(css).toContain('--renamed-change: l c h / 0.5;')
})
test('必要材料与内容领域不符时明确失败，完整CSS配方名直接保存', () => {
  const source = { key: key('--natural-source'), content: 'red' }
  for (const type of ['unknown', 'constructor', 'toString', '__proto__', new String('color')]) {
    expect(() => modification({ type, detail: {} } as never)).toThrow('尚未支持内容领域')
    const change = { type, key: key('--unsupported-route'), content: 'l c h / alpha' } as never
    expect(() => adjust(source, change)).toThrow('配方材料')
    expect(() => modify(source, change)).toThrow('变化材料')
  }
  const invalid = { key: key('--missing-content') } as unknown as typeof source
  expect(() => declare(invalid)).toThrow('key/content')
  expect(compile(declare({ key: key('--empty'), content: undefined }))).toBe('')
  expect(() => adjust(invalid, { type: 'color', key: key('--recipe'), content: 'l c h / 1' })).toThrow('key/content')
  expect(() => modify(source, { type: 'color', content: 'l c h / 1' } as never)).toThrow('变化材料')
  expect(() => modification({ type: 'color', name: 'bare-name', detail: {} })).toThrow('完整 CSS')
  for (const name of [undefined, 7, 'color', { toString: () => '--false-name' }]) {
    const invalidKey = { toCSSString: () => name } as never
    expect(() => adjust(source, { type: 'color', key: invalidKey, content: 'l c h / 1' })).toThrow('配方材料')
    if (typeof name !== 'string') expect(() => declare({ key: invalidKey, content: 'red' })).toThrow('CSS Key')
  }
  const change = modification({ type: 'color', name: '--complete-name', detail: {} })
  expect(change.name).toBe('--complete-name')
  expect(compile(declare(change))).toContain('--complete-name: l c h / alpha;')
})

// 静态契约：操作需要声明材料和领域内容；天然材料的正例由上述行为测试覆盖。
if (false) {
  const source = variable('red', 'adjust-typed-source')
  // @ts-expect-error 只有声明能力不足以成为内置Variable的颜色调整材料。
  adjust(source, { key: key('--invalid-change'), content: 1 })
  // @ts-expect-error Variable的内置颜色Adjust不接受未知内容领域。
  adjust(source, { type: 'unknown', key: key('--invalid-change'), content: '1' })
  // @ts-expect-error 表达修改必须提供回调。
  modify(source, { type: 'expression', detail: 1 })
  // @ts-expect-error mutable已由CSS绑定取代，不保留平行JS调整语义。
  adjust('mutable', source, modification({ type: 'color', detail: {} }))
}

test('配方回调延迟到消费，通道可调用内容与alpha含义仍保留', () => {
  let delta = 0.1
  const lightness = variable(0.6, 'callable-lightness')
  const change = modification({ name: '--callable-change', type: 'color', detail: { lightness, chroma: x => add(x, delta), alpha: 1 } })
  delta = 0.2
  expect(compile(declare(change))).toContain('--callable-change: var(--callable-lightness) calc(c + 0.2) h / 1;')
  expect(compile(declare(modification({ name: '--keep-alpha', type: 'color', detail: {} })))).toContain('--keep-alpha: l c h / alpha;')
})
