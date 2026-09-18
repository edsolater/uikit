/** 验证复合 Value 从 Rule 地址向叶子展开。 */
import { afterEach, expect, test, vi } from 'vitest'
import { subjectCondition } from '../subject-conditions'
import { compileCSS } from '../core/css-root'
import { rule, rules, type RulesHandle } from '../core/css-rule'
import { condition } from '../core/css-condition'
import { value } from '../core/css-value'
import { variable } from '../core/css-variable'
import { $backgroundColor } from '../properties/color'
import { $transform } from '../properties/transform'
import { calcMultiply } from '../values/functions/calc'
import { colorMix } from '../values/functions/color-mix'
import { translateY } from '../values/functions/transform'
import { compileValue } from './compile-value'
import { resolveRules } from './compile-css'

subjectCondition('testHover', condition('&:hover'))
subjectCondition('testActive', condition('&:active'))

const handles: RulesHandle[] = []

/** 保存测试登记，供用例结束后统一移除。 */
function keep<T extends RulesHandle>(handle: T): T {
  handles.push(handle)
  return handle
}

/** 统计片段在 CSS string 中出现的次数。 */
function count(css: string, fragment: string): number {
  return css.split(fragment).length - 1
}

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
})

test('同一激活集合的颜色与比例采用同一优先级', () => {
  const surface = value('black', { testHover: 'navy', testActive: 'blue' })
  const ratio = value(0.82, { testHover: 0.72, testActive: 0.62 })
  expect(resolveRules([[[condition('.Mix')], 'background', colorMix([surface, ratio], 'white')]])).toEqual([
    [['.Mix'], 'background', 'color-mix(in oklab, black 82%, white)'],
    [['.Mix', '&:hover'], 'background', 'color-mix(in oklab, navy 72%, white)'],
    [['.Mix', '&:active'], 'background', 'color-mix(in oklab, blue 62%, white)'],
    [['.Mix', '&:hover', '&:active'], 'background', 'color-mix(in oklab, blue 62%, white)'],
  ])
})

test('不同 Subject Condition 分支保留单条件与交集地址', () => {
  const hover = 'testHover'
  const active = 'testActive'
  const distance = value('2px', [[hover, '4px']])
  const factor = value(2, [[active, 3]])

  keep(rule('.CompiledInvalidIntersection', 'width', calcMultiply(distance, factor)))

  const css = compileCSS()
  expect(css).toBe('.CompiledInvalidIntersection {\nwidth: calc(2px * 2);\n&:hover {\nwidth: calc(4px * 2);\n}\n&:active {\nwidth: calc(2px * 3);\n}\n&:hover {\n&:active {\nwidth: calc(4px * 3);\n}\n}\n}')
})

test('Variable 改写同名 Custom Property，不展开消费函数', () => {
  const hover = 'testHover'
  const active = 'testActive'
  const ratio = variable('compiled-surface-ratio', {
    fallback: value(0.82, [[hover, 0.72], [active, 0.62]]),
  })

  keep(rules('.CompiledVariable', [
    [ratio, value(0.82, [[hover, 0.72], [active, 0.62]])],
    [$backgroundColor, colorMix(['black', ratio], 'white')],
  ]))

  const css = compileCSS()
  expect(count(css, 'background-color:')).toBe(1)
  expect(css).toContain('background-color: color-mix(in oklab, black calc(var(--compiled-surface-ratio, 0.82) * 100%), white);')
  expect(css).toContain('--compiled-surface-ratio: 0.82;')
  expect(css).toContain('&:hover {\n--compiled-surface-ratio: 0.72;\n}')
  expect(css).toContain('&:active {\n--compiled-surface-ratio: 0.62;\n}')
  expect(css).not.toContain('--compiled-surface-ratio-when-')
})

test('嵌套 CSS Function 沿同一临时地址继续解析', () => {
  const hover = 'testHover'
  const active = 'testActive'
  const distance = value('2px', [[hover, '4px'], [active, '6px']])
  const factor = value(1, [[hover, 2], [active, 3]])

  keep(rule('.CompiledNestedFunction', $transform, translateY(calcMultiply(distance, factor))))

  const css = compileCSS()
  expect(count(css, 'transform:')).toBe(4)
  expect(css).toContain('transform: translateY(calc(2px * 1));')
  expect(css).toContain('&:hover {\ntransform: translateY(calc(4px * 2));\n}')
  expect(css).toContain('&:active {\ntransform: translateY(calc(6px * 3));\n}')
  expect(css).toContain('&:hover {\n&:active {\ntransform: translateY(calc(6px * 3));')
  expect(css).not.toContain('&:active {\n&:hover')
})

test('完整解析各参数候选，条件交集的依赖只激活一次', () => {
  const hover = 'testHover'
  const active = 'testActive'
  const rejected = vi.fn()
  const distance = value('2px', [[hover, '4px']])
  const factor = value(2, [[active, value(3, { onActive: rejected })]])
  keep(rule('.OrderedArguments', 'width', calcMultiply(distance, factor)))

  expect(rejected).not.toHaveBeenCalled()
  expect(compileCSS()).toContain('&:hover {\n&:active {\nwidth: calc(4px * 3);')
  expect(rejected).toHaveBeenCalledTimes(1)
})

test('同一父路径的兄弟表达式独立求值，不串用条件或结果', () => {
  const first = value('red', { testHover: 'pink' })
  const second = value('blue', { testHover: 'cyan', testActive: 'navy' })
  const third = value('white', { testHover: 'silver', testActive: 'gray' })
  const output = resolveRules([
    [[condition('.Sibling')], 'background', colorMix(first, colorMix(second, third))],
    [[condition('.Sibling')], 'border-color', colorMix(second, third)],
  ])
  const combined = output.filter(([path]) => path.length === 3)
  expect(combined).toEqual([
    [['.Sibling', '&:hover', '&:active'], 'background', 'color-mix(in oklab, pink, color-mix(in oklab, navy, gray))'],
    [['.Sibling', '&:hover', '&:active'], 'border-color', 'color-mix(in oklab, navy, gray)'],
  ])
})

test('共享两个条件的三个 Value 只求值四个激活集合', () => {
  const hover = 'testHover'
  const active = 'testActive'
  const first = value('red', [[hover, 'pink']])
  const second = value('blue', [[hover, 'cyan'], [active, 'navy']])
  const third = value('white', [[hover, 'silver'], [active, 'gray']])
  const candidates = compileValue(colorMix(first, colorMix(second, third)), {
    root: [], path: [], resolving: new Set(), activate() {}, defineVariable() {},
  })
  expect(candidates).toHaveLength(4)
  expect(new Set(candidates.map(({ conditions }) => JSON.stringify(conditions))).size).toBe(4)
  expect(candidates[0].conditions).toEqual([])
  expect(candidates.some((candidate) => JSON.stringify(candidate.conditions) === JSON.stringify([hover, active]))).toBe(true)
  expect(candidates.every((candidate) => candidate.conditions.length <= 3)).toBe(true)
})

test('三个普通 Value 与嵌套函数保留各分支及规范交集', () => {
  const hover = 'testHover'
  const active = 'testActive'
  const first = value('black', [[hover, 'navy'], [active, 'blue']])
  const second = value('white', [[hover, 'silver'], [active, 'gray']])
  const ratio = value(0.8, [[hover, 0.7], [active, 0.6]])
  keep(rule('.ThreeArguments', 'background-color', colorMix([first, ratio], colorMix(second, 'transparent'))))

  const css = compileCSS()
  expect(count(css, 'background-color:')).toBe(4)
  expect(css).toContain('black 80%, color-mix(in oklab, white, transparent)')
  expect(css).toContain('navy 70%, color-mix(in oklab, silver, transparent)')
  expect(css).toContain('blue 60%, color-mix(in oklab, gray, transparent)')
})

test('动态 Variable 在每个消费地址补充同名默认赋值，显式覆盖优先', () => {
  const hover = 'testHover'
  const ratio = variable('shared-ratio', { fallback: value(0.8, [[hover, 0.6]]) })
  keep(rule('.FirstConsumer', 'opacity', ratio))
  keep(rules('.SecondConsumer', [[ratio, [[hover, 0.3]]], ['opacity', ratio]]))

  const css = compileCSS()
  expect(css).toContain('.FirstConsumer {\n--shared-ratio: 0.8;\n&:hover {\n--shared-ratio: 0.6;')
  expect(css).toContain('opacity: var(--shared-ratio, 0.8);')
  expect(css).toContain('.SecondConsumer {\n--shared-ratio: 0.8;')
  expect(css).toContain('&:hover {\n--shared-ratio: 0.3;')
  expect(count(css, '--shared-ratio: 0.6;')).toBe(1)
  expect(count(css, 'opacity: var(--shared-ratio, 0.8);')).toBe(2)
})

test('动态 Variable 嵌入 Function 与另一个 Variable 时仍保持引用', () => {
  const hover = 'testHover'
  const inner = variable('inner-ratio', { fallback: value(0.8, [[hover, 0.6]]) })
  const outer = variable('outer-ratio', { fallback: calcMultiply(inner, 0.5) })
  keep(rule('.NestedVariables', 'background-color', colorMix(['black', outer], 'white')))

  const css = compileCSS()
  expect(count(css, 'background-color:')).toBe(1)
  expect(css).toContain('calc(var(--outer-ratio, calc(var(--inner-ratio, 0.8) * 0.5)) * 100%)')
  expect(css).toContain('&:hover {\n--inner-ratio: 0.6;')
})

test('Variable 局部覆盖的条件继续约束嵌套 Value', () => {
  const hover = 'testHover'
  const active = 'testActive'
  const ratio = variable('local-ratio')
  keep(rules('.LocalOverride', [[ratio, [[hover, value(1, [[hover, 2], [active, 3]])]]]]))

  expect(compileCSS()).toBe('.LocalOverride {\n&:hover {\n--local-ratio: 2;\n&:active {\n--local-ratio: 3;\n}\n}\n}')
})
