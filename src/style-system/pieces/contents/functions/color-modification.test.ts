/** 颜色修改规则的 CSS 消费验证。
 *
 * 验证完整通道输出、固定值与表达式依赖。
 *
 * 浏览器数值和条件叠加由领域流程测试验证。
 */
import { expect, test } from 'vitest'
import { add, applyColorModification, colorModification, condition, declare, value, multiply, variable, variableCluster } from '../../..'
import { compileRules } from '../../../css-root'

test('完整规则保存为单个Variable后应用，保留来源和规则引用', () => {
  const change = variable(colorModification({ lightness: 0.6 }), 'fixed-change')
  const css = compileRules([[[condition('.Color')], 'color', applyColorModification(value('red'), change)]])
  expect(css).toContain('color: oklch(from red var(--fixed-change, 0.6 c h / alpha));')
})

test('来源透明度保持与显式透明度1有不同的规则输出', () => {
  const source = value('oklch(0.6 0.12 250 / 0.4)')
  let delta = -0.02
  const relative = applyColorModification(source, colorModification({ lightness: currentExpression => add(currentExpression, delta) }))
  delta = -0.04
  const css = compileRules([
    [[condition('.Follow')], 'color', relative],
    [[condition('.Opaque')], 'color', applyColorModification(source, colorModification({ alpha: 1 }))],
  ])
  expect(css).toContain('calc(l + -0.04) c h / alpha')
  expect(css).toContain('l c h / 1')
})

test('可调用Cluster通道作为内容消费，普通通道回调仍构造表达式', () => {
  const lightness = variableCluster({ default: variable(0.6, 'rule-lightness') })
  const rule = colorModification({ lightness, chroma: currentExpression => multiply(currentExpression, 0.8) })
  const css = compileRules([[[condition('.CallableChannel')], ...declare(variable(rule, 'change'))]])
  expect(css).toContain('--change: var(--rule-lightness, 0.6) calc(c * 0.8) h / alpha;')
})
