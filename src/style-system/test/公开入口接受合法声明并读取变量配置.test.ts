/** 公开类型保留目标与内容的关系，并直接提供 Variable 创建配置。 */
import { expect, test } from 'vitest'
import { clusterFrom, key, rules, variable, variableCluster } from '../index'

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


test('公开 Variable 方法直接作为声明，Cluster 代理默认成员的方法', () => {
  const amount = variable(1, { name: 'method-amount', modification: { apply: (current) => current } })
  const cluster = variableCluster({ default: amount })
  const declaration = rules('.Method', [amount.declare(10), [key('z-index'), amount]])
  const modification = rules(['.Method', 'hover'], [amount.modify({ arbitrary: true })])
  expect(cluster.declare).toBe(amount.declare)
  expect(cluster.modify).toBe(amount.modify)
  declaration.remove()
  modification.remove()
})

test('Cluster 延伸配置允许由 apply 自行解释任意修改参数', () => {
  const source = variableCluster({ default: variable(1, { name: 'public-source-number' }) })
  const cluster = clusterFrom(source, {
    default: {
      name: 'public-derived-number',
      modification: { apply: (current: import('../value').ValueInput, change: { amount: number }) => current ?? change.amount },
    },
  })
  expect(cluster('default').modify({ amount: 3 })).toBeDefined()
})
