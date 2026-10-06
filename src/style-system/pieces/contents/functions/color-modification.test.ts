/** 颜色修改规则的内容协议验证。
 *
 * 验证完整通道输出、固定值与表达式依赖。
 *
 * 浏览器数值和条件叠加由领域流程测试验证。
 */
import { expect, test } from 'vitest'
import { add, applyColorModification, colorModification, condition, value, multiply, variable, variableCluster } from '../../..'
import { compileRules } from '../../../css-root'

test('一条规则同时修改多个通道，其他通道继续读取来源', () => {
  const rule = colorModification({ lightness: currentExpression => add(currentExpression, 0.05),
    chroma: currentExpression => multiply(currentExpression, 0.8), alpha: 0.7 })
  const css = compileRules([[[condition('.Change')], '--change', rule]])
  expect(css).toContain('--change: calc(l + 0.05) calc(c * 0.8) h / 0.7;')
})

test('完整规则保存为单个Variable后应用，保留来源和规则引用', () => {
  const change = variable(colorModification({ lightness: 0.6 }), 'fixed-change')
  const css = compileRules([[[condition('.Color')], 'color', applyColorModification(value('red'), change)]])
  expect(css).toContain('color: oklch(from red var(--fixed-change, 0.6 c h / alpha));')
})

test('来源透明度保持与显式透明度1有不同的规则输出', () => {
  const source = value('oklch(0.6 0.12 250 / 0.4)')
  const css = compileRules([
    [[condition('.Follow')], 'color', applyColorModification(source, colorModification({ lightness: currentExpression => add(currentExpression, -0.04) }))],
    [[condition('.Opaque')], 'color', applyColorModification(source, colorModification({ alpha: 1 }))],
  ])
  expect(css).toContain('calc(l + -0.04) c h / alpha')
  expect(css).toContain('l c h / 1')
})

test('可调用Cluster通道作为内容消费，普通通道回调仍构造表达式', () => {
  const lightness = variableCluster({ default: variable(0.6, 'rule-lightness') })
  const rule = colorModification({ lightness, chroma: currentExpression => multiply(currentExpression, 0.8) })
  const css = compileRules([[[condition('.CallableChannel')], '--change', rule]])
  expect(css).toContain('--change: var(--rule-lightness, 0.6) calc(c * 0.8) h / alpha;')
})
