/** 颜色变化描述与配方消费验证。
 *
 * 验证完整通道输出、表达式依赖及 CSS 配方与 JS 调整的一致结果。
 *
 * 浏览器数值和条件叠加由领域流程测试验证。
 */
import { expect, test } from 'vitest'
import { add, adjust, relativeOKLCH, condition, declare, value, multiply, oklch, variable, variableCluster } from './index'
import { colorVariableModification } from './color-variable-modification'
import { compileRules } from './css-root'

test('完整规则保存为单个Variable后应用，保留来源和规则引用', () => {
  const change = variable(colorVariableModification({ lightness: 0.6 }), 'fixed-change')
  const css = compileRules([[[condition('.Color')], 'color', relativeOKLCH(value('red'), change)]])
  expect(css).toContain('color: oklch(from red var(--fixed-change, 0.6 c h / alpha));')
})

test('替换变化描述后，配方输出与JS调整使用同一通道配置', () => {
  const change = colorVariableModification({ lightness: 0.3 })
  const recipe = variable(change, 'updated-change')
  change.change = { lightness: 0.7 }
  const adjusted = adjust(variable(oklch({ lightness: 0.4, chroma: 0.1, hue: 120 })), change)
  const css = compileRules([
    [[condition('.Recipe')], 'color', relativeOKLCH(value('red'), recipe)],
    [[condition('.Adjusted')], ...declare(adjusted)],
  ])
  expect(css).toContain('color: oklch(from red var(--updated-change, 0.7 c h / alpha));')
  expect(css).toContain('oklch(0.7 0.1 120);')
})

test('来源透明度保持与显式透明度1有不同的规则输出', () => {
  const source = value('oklch(0.6 0.12 250 / 0.4)')
  let delta = -0.02
  const relative = relativeOKLCH(source, colorVariableModification({ lightness: currentExpression => add(currentExpression, delta) }))
  delta = -0.04
  const css = compileRules([
    [[condition('.Follow')], 'color', relative],
    [[condition('.Opaque')], 'color', relativeOKLCH(source, colorVariableModification({ alpha: 1 }))],
  ])
  expect(css).toContain('calc(l + -0.04) c h / alpha')
  expect(css).toContain('l c h / 1')
})

test('可调用Cluster通道作为内容消费，普通通道回调仍构造表达式', () => {
  const lightness = variableCluster({ default: variable(0.6, 'rule-lightness') })
  const rule = colorVariableModification({ lightness, chroma: currentExpression => multiply(currentExpression, 0.8) })
  const css = compileRules([[[condition('.CallableChannel')], ...declare(variable(rule, 'change'))]])
  expect(css).toContain('--change: var(--rule-lightness, 0.6) calc(c * 0.8) h / alpha;')
})
