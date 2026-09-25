/** 公开类型保留目标与内容的明确关系，以及 Variable 的黑盒边界。 */
import { expect, test } from 'vitest'
import { key, rules, variable, variableFrom, variableCluster } from '../index'

test('合法 Key、Variable、Cluster 和声明组合可以直接消费', () => {
  const source = variable('red', { name: 'public-color' })
  const cluster = variableCluster({ default: source, soft: variableFrom(source, { name: 'public-soft-color' }) })
  const handle = rules('.Public', [[key('color'), cluster('soft')], [cluster, 'blue']])
  handle.remove()
  expect(cluster('default')).toBe(source)
  if (false) {
    // @ts-expect-error Variable 定义后是黑盒。
    source.states.active
    // @ts-expect-error Cluster 只接受已声明成员。
    cluster('unknown')
  }
})
