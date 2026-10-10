/** 独立变化与三者声明的流程验证。

核对配方转译、共享依赖、结构协议和生命周期的实际 CSS。

断言公开声明与消费结果，浏览器中的局部覆盖另由流程测试验证。
*/
import { expect, test } from 'vitest'
import { add } from '../pieces/contents/functions/calc'
import { adjust } from '../variable-adjust'
import { declare, type Declaration } from '../declaration'
import { key } from '../key'
import { modification, type Modification } from '../modification'
import { modify } from '../variable-modify'
import { oklch } from '../pieces/contents/functions/oklch'
import { value } from '../value'
import { variable } from '../variable'
import { variableCluster } from '../variable-cluster'
import { type Rules } from '../rule'
import { compileRules } from '../css-root'

/**
 * 将一组公开声明放在同一作用域编译。
 */
const compile = (...entries: Declaration[]): string => compileRules(entries.map(entry => [['.Binding'], ...entry]))

test('不同描述可独立声明，颜色配方可直接引用且不绑定某个来源', () => {
  const change = modification({ name: '--change', type: 'color', detail: { lightness: 0.3, chroma: x => add(x, 0.3) } })
  const css = compile(declare(change), [key('--reference'), change])
  expect(css).toContain('--change: 0.3 calc(c + 0.3) h / alpha;')
  expect(css).toContain('--reference: var(--change, 0.3 calc(c + 0.3) h / alpha);')
  const targetKey = key('--generic-description')
  const generic: Modification<number, 'number'> = { ...targetKey, key: targetKey, name: targetKey.toCSSString(), type: 'number', detail: 5, content: 5 }
  expect(compile(declare(generic))).toContain('--generic-description: 5;')
})

test('声明结果共同声明来源、变化与结果，两个来源共享同一变化声明', () => {
  const first = variable(oklch({ lightness: 0.5, chroma: 0.1, hue: 240 }), 'source-first')
  const second = variable('red', 'source-second')
  const change = modification({ name: '--shared-change', type: 'color', detail: { lightness: 0.3 } })
  const firstResult = adjust(first, change), secondResult = adjust(second, change)
  const css = compile(declare(firstResult), declare(secondResult))
  expect(css).toContain('--source-first: oklch(0.5 0.1 240);')
  expect(css).toContain('--source-second: red;')
  expect(css.match(/--shared-change:/g)).toHaveLength(1)
  expect(css).toContain(`${firstResult.toCSSString()}: oklch(from var(--source-first, oklch(0.5 0.1 240)) var(--shared-change, 0.3 c h / alpha));`)
  expect(css).toContain(`${secondResult.toCSSString()}: oklch(from var(--source-second, red) var(--shared-change, 0.3 c h / alpha));`)
})

test('配方回调延迟到消费，通道可调用内容与alpha含义仍保留', () => {
  let delta = 0.1
  const lightness = variableCluster({ default: variable(0.6, 'callable-lightness') })
  const change = modification({ name: '--callable-change', type: 'color', detail: { lightness, chroma: x => add(x, delta), alpha: 1 } })
  delta = 0.2
  expect(compile(declare(change))).toContain('--callable-change: var(--callable-lightness, 0.6) calc(c + 0.2) h / 1;')
  expect(compile(declare(modification({ name: '--keep-alpha', type: 'color', detail: {} })))).toContain('--keep-alpha: l c h / alpha;')
})

test('撤销一份绑定保留另一份的共享依赖，全部撤销后不泄漏声明或按需资源', () => {
  for (const removeAll of [false, true]) {
    const source = { key: key('--owned-source'), content: value('red', { onActive: (): Rules => [[['.BindingResource'], 'opacity', 0.5]] }), registration: { syntax: '<color>', inherits: true, initialValue: 'black' } }
    const change = { type: 'color' as const, key: key('--owned-change'), content: 'l c h / 0.5', onActive: (): Rules => [[['.ChangeResource'], 'opacity', 0.5]] }
    const first = adjust(source, change), second = adjust(source, change)
    const declarations = [declare(first), declare(second)]
    const css = compileRules([
      ...declarations.map(entry => [['.Binding'], ...entry] as Rules[number]),
      [[], 'order', { compileWaveIndex: 2, onCompile(context, controller) {
        for (const entry of declarations.slice(0, removeAll ? 2 : 1)) {
          const node = controller.search({ key: entry[0] }).find(node => node.content === entry[1])
          if (node) controller.remove(node)
        }
        controller.setContent(context, 1)
      } }],
    ])
    expect(css.includes('--owned-source:')).toBe(!removeAll)
    expect(css.includes('--owned-change:')).toBe(!removeAll)
    expect(css.includes('.BindingResource')).toBe(!removeAll)
    expect(css.includes('@property --owned-source')).toBe(!removeAll)
    expect(css.includes('.ChangeResource')).toBe(!removeAll)
    expect(compile(declare(source), modify(source, change))).toContain('.ChangeResource')
  }
})

test.each(['explicit', 'natural', 'source', 'change'])('匿名绑定与显式、天然材料及改名材料独立声明：%s', mode => {
  const reserved = 'binding-source'
  const source = mode === 'natural' ? { key: key(`--${reserved}`), content: 'red' } : variable('red', mode === 'explicit' ? reserved : 'renamed-source')
  const change = modification({ type: 'color', name: mode === 'explicit' ? undefined : '--renamed-change', detail: { alpha: 0.5 } })
  if (mode === 'source' && 'name' in source) source.name = reserved
  if (mode === 'change') change.name = `--${reserved}`
  const merged = adjust(source, change)
  const css = compile(declare(merged))
  const names = [source.key.toCSSString(), change.toCSSString(), merged.toCSSString()]
  expect(new Set(names).size).toBe(3)
  for (const name of names) expect(css).toContain(`${name}:`)
  expect(css).toContain(`${source.key.toCSSString()}: red;`)
  expect(css).toContain(`${change.toCSSString()}: l c h / 0.5;`)
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
  const source = variable('red')
  // @ts-expect-error 只有声明能力不足以成为内置Variable的颜色调整材料。
  adjust(source, { key: key('--invalid-change'), content: 1 })
  // @ts-expect-error Variable的内置颜色Adjust不接受未知内容领域。
  adjust(source, { type: 'unknown', key: key('--invalid-change'), content: '1' })
  // @ts-expect-error 表达修改必须提供回调。
  modify(source, { type: 'expression', detail: 1 })
  // @ts-expect-error mutable已由CSS绑定取代，不保留平行JS调整语义。
  adjust('mutable', source, modification({ type: 'color', detail: {} }))
}
