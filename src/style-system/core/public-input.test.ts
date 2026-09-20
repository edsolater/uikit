/** 公开类型拒绝旧声明入口与 Variable 内部访问。 */
import { expect, test } from 'vitest'
import { key, rules, variable, variableFrom, variableCluster } from '../index'

test('合法 Key、Variable、Cluster 和声明组合可以直接消费', () => {
  const source = variable('red', { name: 'public-color' })
  const cluster = variableCluster({ default: source, soft: variableFrom(source, { name: 'public-soft-color' }) })
  const handle = rules('.Public', [[key('color'), cluster('soft')], [cluster, 'blue']])
  handle.remove()
  expect(cluster('default')).toBe(source)
  if (false) {
    // @ts-expect-error 不接受声明对象。
    rules('.Probe', { opacity: 1 })
    // @ts-expect-error 不接受裸字符串目标。
    rules('.Probe', [['opacity', 1]])
    // @ts-expect-error 字符串不是声明序列。
    rules('.Probe', 'opacity')
    // @ts-expect-error 嵌套对象也不接受。
    rules('.Probe', [[{ opacity: 1 }]])
    // @ts-expect-error Variable 定义后是黑盒。
    source.states.active
    // @ts-expect-error Cluster 只接受已声明成员。
    cluster('unknown')
  }
})
