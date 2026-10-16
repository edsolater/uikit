/** 公开类型保留目标与内容的关系，并直接提供 Variable 创建配置。 */
import { declare } from '../declaration'
import { modify } from '../variable-modify'
import { expect, test, vi } from 'vitest'
import { add, clusterFrom, key, rules, variable, variableCluster } from '../index'
import { condition } from '../condition'
import { compileRules } from '../css-root'

test('合法 Key、Variable、Cluster 和声明组合可以直接消费', () => {
  const source = variable('red', { name: 'public-color' })
  const cluster = variableCluster({ default: source, soft: variable(source, { name: 'public-soft-color' }) })
  const handle = rules('.Public', [[key('color'), cluster('soft')], [cluster, 'blue']])
  handle.remove()
  expect(cluster('default')).toBe(source)
  expect(source.config.defaultValue).toBe('red')
  expect(cluster.config).toBe(source.config)
  if (false) {
    // @ts-expect-error 状态内容位于 config.states。
    source.states.active
    // @ts-expect-error Variable 不保存来源关系。
    source.inherited
    // @ts-expect-error 自动声明 Key 位于 config.definitionKey。
    source.definitionKey
    // @ts-expect-error Cluster 只接受已声明成员。
    cluster('unknown')
  }
})


test('Cluster默认成员应用规则闭包捕获的领域参数', () => {
  const source = variableCluster({ default: variable(1, { name: 'public-source-number' }) })
  const cluster = clusterFrom(source, {
    default: {
      name: 'public-derived-number',
    },
  })
  const payload = { amount: 3 }
  const change = ({ type: 'expression' as const, detail: currentExpression => add(currentExpression, payload.amount) })
  const css = compileRules([[[condition('.Public')], ...declare(cluster)], [[condition('.Public')], ...modify(cluster, change)]])
  expect(css).toContain('+ 3)')
  expect(compileRules([[['.source'], ...declare(cluster)]])).toContain('--public-derived-number: var(--public-source-number);')
})

test('简写与完整参数生成同样的 CSS 并保留状态优先级', () => {
  const shorthand = variable({ default: 1, active: 3, hover: 2 }, '--public-shorthand')
  const full = variable(1, { name: 'public-shorthand', states: { hover: 2, active: 3 } })
  const compile = (content: typeof shorthand) => compileRules([[[condition('.Shorthand')], 'opacity', content]])
  const css = compile(shorthand)
  expect(css).toBe(compile(full))
  expect(css).toContain('--public-shorthand: 1;')
  expect(css).toContain('--public-shorthand: 2;')
  expect(css).toContain('--public-shorthand: 3;')
  expect(css.indexOf('--public-shorthand: 2;')).toBeLessThan(css.indexOf('--public-shorthand: 3;'))
})

test('简写默认生产函数在消费时求值，常量状态独立保留', () => {
  const source = vi.fn(() => 1)
  const amount = variable({ default: source, hover: 2 }, 'public-lazy-shorthand')
  expect(source).not.toHaveBeenCalled()
  const css = compileRules([[[condition('.LazyShorthand')], 'opacity', amount]])
  expect(css).toContain('--public-lazy-shorthand: 1;')
  expect(css).toContain('--public-lazy-shorthand: 2;')
  expect(source).toHaveBeenCalled()
})
