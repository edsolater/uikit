/** 验证复合 Value 从 Rule 地址向叶子展开。 */
import { afterEach, expect, test, vi } from 'vitest'
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

test('同址 Condition Value 汇合，default 输出空地址', () => {
  const hover = condition('&:hover')
  const active = condition('&:active')
  const surface = value('black', [[hover, 'navy'], [active, 'blue']])
  const ratio = value(0.82, [[hover, 0.72], [active, 0.62]])

  keep(rule('.CompiledColorMix', $backgroundColor, colorMix([surface, ratio], 'white')))

  expect(compileCSS()).toBe([
    '.CompiledColorMix {',
    'background-color: color-mix(in oklab, black 82%, white);',
    '&:hover {',
    'background-color: color-mix(in oklab, navy 72%, white);',
    '}',
    '&:active {',
    'background-color: color-mix(in oklab, blue 62%, white);',
    '}',
    '}',
  ].join('\n'))
})

test('不同 Condition 分支不组合成临时交集地址', () => {
  const hover = condition('&:hover')
  const active = condition('&:active')
  const distance = value('2px', [[hover, '4px']])
  const factor = value(2, [[active, 3]])

  keep(rule('.CompiledInvalidIntersection', 'width', calcMultiply(distance, factor)))

  const css = compileCSS()
  expect(css).toBe('.CompiledInvalidIntersection {\nwidth: calc(2px * 2);\n}')
  expect(css).not.toContain('&:hover')
  expect(css).not.toContain('&:active')
})

test('Variable 改写同名 Custom Property，不展开消费函数', () => {
  const hover = condition('&:hover')
  const active = condition('&:active')
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
  const hover = condition('&:hover')
  const active = condition('&:active')
  const distance = value('2px', [[hover, '4px'], [active, '6px']])
  const factor = value(1, [[hover, 2], [active, 3]])

  keep(rule('.CompiledNestedFunction', $transform, translateY(calcMultiply(distance, factor))))

  const css = compileCSS()
  expect(count(css, 'transform:')).toBe(3)
  expect(css).toContain('transform: translateY(calc(2px * 1));')
  expect(css).toContain('&:hover {\ntransform: translateY(calc(4px * 2));\n}')
  expect(css).toContain('&:active {\ntransform: translateY(calc(6px * 3));\n}')
  expect(css).not.toContain('&:hover {\n&:active')
  expect(css).not.toContain('&:active {\n&:hover')
})

test('前一个参数约束后续参数，拒绝分支不激活其叶子依赖', () => {
  const hover = condition('&:hover')
  const active = condition('&:active')
  const rejected = vi.fn()
  const distance = value('2px', [[hover, '4px']])
  const factor = value(2, [[active, value(3, { onActive: rejected })]])
  keep(rule('.OrderedArguments', 'width', calcMultiply(distance, factor)))

  expect(rejected).not.toHaveBeenCalled()
  expect(compileCSS()).toBe('.OrderedArguments {\nwidth: calc(2px * 2);\n}')
  expect(rejected).not.toHaveBeenCalled()
})

test('三个智能参数与嵌套函数只保留共同分支', () => {
  const hover = condition('&:hover')
  const active = condition('&:active')
  const first = value('black', [[hover, 'navy'], [active, 'blue']])
  const second = value('white', [[hover, 'silver'], [active, 'gray']])
  const ratio = value(0.8, [[hover, 0.7], [active, 0.6]])
  keep(rule('.ThreeArguments', 'background-color', colorMix([first, ratio], colorMix(second, 'transparent'))))

  const css = compileCSS()
  expect(count(css, 'background-color:')).toBe(3)
  expect(css).toContain('black 80%, color-mix(in oklab, white, transparent)')
  expect(css).toContain('navy 70%, color-mix(in oklab, silver, transparent)')
  expect(css).toContain('blue 60%, color-mix(in oklab, gray, transparent)')
})

test('动态 Variable 在每个消费地址补充同名默认赋值，显式覆盖优先', () => {
  const hover = condition('&:hover')
  const ratio = variable('shared-ratio', { fallback: value(0.8, [[hover, 0.6]]) })
  keep(rule('.FirstConsumer', 'opacity', ratio))
  keep(rules('.SecondConsumer', [[ratio, [[hover, 0.3]]], ['opacity', ratio]]))

  const css = compileCSS()
  expect(css).toContain('.FirstConsumer {\n--shared-ratio: 0.8;\n&:hover {\n--shared-ratio: 0.6;')
  expect(css).toContain('.SecondConsumer {\n--shared-ratio: 0.8;')
  expect(css).toContain('&:hover {\n--shared-ratio: 0.3;')
  expect(count(css, '--shared-ratio: 0.6;')).toBe(1)
  expect(count(css, 'opacity: var(--shared-ratio, 0.8);')).toBe(2)
})

test('动态 Variable 嵌入 Function 与另一个 Variable 时仍保持引用', () => {
  const hover = condition('&:hover')
  const inner = variable('inner-ratio', { fallback: value(0.8, [[hover, 0.6]]) })
  const outer = variable('outer-ratio', { fallback: calcMultiply(inner, 0.5) })
  keep(rule('.NestedVariables', 'background-color', colorMix(['black', outer], 'white')))

  const css = compileCSS()
  expect(count(css, 'background-color:')).toBe(1)
  expect(css).toContain('calc(var(--outer-ratio, calc(var(--inner-ratio, 0.8) * 0.5)) * 100%)')
  expect(css).toContain('&:hover {\n--inner-ratio: 0.6;')
})

test('Variable 局部覆盖的条件继续约束嵌套 Value', () => {
  const hover = condition('&:hover')
  const active = condition('&:active')
  const ratio = variable('local-ratio')
  keep(rules('.LocalOverride', [[ratio, [[hover, value(1, [[hover, 2], [active, 3]])]]]]))

  expect(compileCSS()).toBe('.LocalOverride {\n&:hover {\n--local-ratio: 2;\n}\n}')
})
