/** 验证变量修改的声明归属、诊断与依赖生命周期。
 *
 * 同一流程的浏览器数值与条件组合由相邻浏览器测试验证。
 *
 * 这里检查编译失败和资源输出，不绑定内部步骤名称或查询次数。
 */
import { expect, test } from 'vitest'
import { add, condition, createJSSContent, declare, modify, value, variable } from '../index'
import { compileRules } from '../css-root'
import type { Declaration } from '../declaration'
import type { Rules } from '../rule'

const button = condition('.button'), hover = condition('&:hover')
const row = (path: (ReturnType<typeof condition> | string)[], declaration: Declaration): Rules[number] => [path, ...declaration]

test('缺失局部声明或应用规则时给出明确诊断', () => {
  const amount = variable(1, 'diagnostic-amount')
  expect(() => compileRules([row([button], modify(amount, 3))])).toThrow('找不到父路径定义')
  expect(() => compileRules([row([button], declare(amount)), row([button], modify(amount, 3))])).toThrow('modification.apply')
})

test('同名不同对象不共用局部声明，重复同路径局部声明给出诊断', () => {
  const first = variable(1, { name: 'same-name', modification: { apply: add } })
  const second = variable(1, { name: 'same-name', modification: { apply: add } })
  expect(() => compileRules([row([button], declare(first)), row([button], modify(second, 3))])).toThrow('找不到父路径定义')
  expect(() => compileRules([row([button], declare(first)), row([button], declare(first))])).toThrow('重复定义')
})

test('修改参数由apply解释，未使用的内容不激活依赖', () => {
  const unused = value(2, { onActive: () => [[[condition('.unused-resource')], 'color', 'red']] })
  const amount = variable(1, { name: 'ignored-change', modification: { apply: currentExpression => currentExpression } })
  expect(compileRules([row([button], declare(amount)), row([button], modify(amount, unused))])).not.toContain('.unused-resource')
})

test('递归修改表达式由普通内容编译诊断', () => {
  const recursive = createJSSContent(() => '1')
  recursive.dependencies = [recursive]
  const amount = variable(1, { name: 'recursive-change', modification: { apply: () => recursive } })
  expect(() => compileRules([row([button], declare(amount)), row([button], modify(amount, 2))])).toThrow('循环引用')
})

test('删除修改消费者清理独占依赖，共享消费者仍保留资源', () => {
  const resource = value(2, { onActive: () => [[[condition('.shared-resource')], 'color', 'red']] })
  for (const shared of [false, true]) {
    const amount = variable(1, { name: 'removed-change', modification: { apply: add } })
    const operation = modify(amount, resource)
    const css = compileRules([
      row([button], declare(amount)), row([button, hover], operation),
      ...(shared ? [[[button], 'opacity', resource] as Rules[number]] : []),
      [[], 'order', { compileWaveIndex: 2, onCompile(context, controller) {
        controller.remove(controller.search({}).find(node => node.content === operation[1])!)
        controller.setContent(context, 1)
      } }],
    ])
    expect(css.includes('.shared-resource')).toBe(shared)
  }
})

test('声明或修改激活Variable自身资源，撤销所有消费者后清理', () => {
  const amount = variable(1, { name: 'own-resource', modification: { apply: add },
    onActive: () => [[[condition('.own-resource')], 'opacity', 0.4]],
    registration: { syntax: '<number>', inherits: true, initialValue: 1 },
  })
  const declaration = declare(amount), modification = modify(amount, 2)
  const css = compileRules([
    row([button], declaration), row([button], modification),
    [[], 'order', { compileWaveIndex: 2, onCompile(context, controller) {
      controller.remove(controller.search({}).find(node => node.content === modification[1])!)
      controller.remove(controller.search({}).find(node => node.content === declaration[1])!)
      controller.setContent(context, 1)
    } }],
  ])
  expect(css).not.toContain('.own-resource')
  expect(css).not.toContain('@property --own-resource')
})
