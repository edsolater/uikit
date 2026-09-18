/** 验证名称登记、条件组合、普通路径与 Variable 的隔离。 */
import { expect, test } from 'vitest'
import { condition, media, type ConditionPath } from '../core/css-condition'
import { value, type ValueInput } from '../core/css-value'
import { variable, type VariableOverrides } from '../core/css-variable'
import type { Rules } from '../core/css-rule'
import { subjectCondition, resolveSubjectConditions } from '../subject-conditions'
import { calcMultiply } from '../values/functions/calc'
import { translateY } from '../values/functions/transform'
import { compileRules, resolveRules } from './compile-css'

const a = subjectCondition('combinationA', condition('&[data-a]'))
const b = subjectCondition('combinationB', condition('&[data-b]'))
const c = subjectCondition('combinationC', media('(width > 800px)'))
const container = subjectCondition('combinationContainer', condition('@container (width < 500px)'))

/** 从同一正式编译阶段取得测试表达式的完整记录。 */
function records(input: ValueInput, path: ConditionPath = [condition('.Subject')]) {
  return resolveRules([[path, 'width', input]])
}

test('登记持有原 Condition，顺序由中央定义决定，重复与保留名称报错', () => {
  expect(a.order).toBeLessThan(b.order)
  expect(b.order).toBeLessThan(c.order)
  expect(resolveSubjectConditions([c.name, a.name, b.name, a.name])).toEqual([a, b, c])
  expect(resolveSubjectConditions([a.name])[0].condition).toBe(a.condition)
  expect(() => subjectCondition(a.name, condition('&:focus'))).toThrow('已登记')
  expect(() => subjectCondition('default', a.condition)).toThrow('default')
  expect(() => subjectCondition('', a.condition)).toThrow('不能为空')
})

test('同一 Value 分支反序与重复名称不改变中央顺序或 CSS', () => {
  const forward = value(1, [[a.name, 2], [b.name, 3]])
  const reverse = value(1, [[b.name, 3], [a.name, 2]])
  const repeated = value(1, [[b.name, 30], [a.name, 2], [b.name, 3]])
  expect(records(reverse)).toEqual(records(forward))
  expect(records(repeated)).toEqual(records(forward))
  /** 为不同分支顺序构造相同的普通 Rule 地址。 */
  const source = (input: ValueInput): Rules => [[[condition('.Subject')], 'width', input]]
  expect(compileRules(source(reverse))).toBe(compileRules(source(forward)))
  expect(compileRules(source(repeated))).toBe(compileRules(source(forward)))
  expect(records(forward).map(([path]) => path)).toEqual([['.Subject'], ['.Subject', a.condition.header], ['.Subject', b.condition.header], ['.Subject', a.condition.header, b.condition.header]])
})

test('Variable 覆盖按中央顺序展开，重复名称与 default 使用最后内容', () => {
  const reference = variable('subject-order')
  /** 保持相同变量和普通地址，只改变覆盖条目的书写顺序。 */
  const source = (input: VariableOverrides): Rules => [[[condition('.Subject')], reference, input]]
  const forward = source([[undefined, 1], [a.name, 2], [b.name, 3]])
  const reverse = source([[b.name, 3], [a.name, 2], [undefined, 1]])
  const repeated = source([[b.name, 30], [undefined, 10], [a.name, 2], [b.name, 3], [undefined, 1]])
  expect(resolveRules(reverse)).toEqual(resolveRules(forward))
  expect(resolveRules(repeated)).toEqual(resolveRules(forward))
  expect(compileRules(reverse)).toBe(compileRules(forward))
  expect(compileRules(repeated)).toBe(compileRules(forward))
  expect(resolveRules(forward)).toEqual([
    [['.Subject'], '--subject-order', '1'],
    [['.Subject', a.condition.header], '--subject-order', '2'],
    [['.Subject', b.condition.header], '--subject-order', '3'],
    [['.Subject', a.condition.header, b.condition.header], '--subject-order', '3'],
  ])
})

test('两个 Value 覆盖 A/B/C 的全部激活集合，同名条件仅一层', () => {
  const left = value(1, [[a.name, 2], [b.name, 3]])
  const right = value(10, [[b.name, 20], [c.name, 30]])
  const output = records(calcMultiply(left, right))
  const expected = [[], [a.condition], [b.condition], [c.condition], [a.condition, b.condition], [a.condition, c.condition], [b.condition, c.condition], [a.condition, b.condition, c.condition]]
    .map((path) => JSON.stringify(['.Subject', ...path.map((entry) => entry.header)])).sort()
  expect(output.map(([path]) => JSON.stringify(path)).sort()).toEqual(expected)
  expect(output.find(([path]) => path.length === 1)?.[2]).toBe('calc(1 * 10)')
  expect(output.find(([path]) => JSON.stringify(path) === JSON.stringify(['.Subject', b.condition.header]))?.[2]).toBe('calc(3 * 20)')
  expect(output.every(([path]) => path.length <= 4)).toBe(true)
})

test('交换 Value 出现顺序不会改变规范路径，递归 Function 延续同一条件集合', () => {
  const left = value(1, [[a.name, 2], [b.name, 3]])
  const right = value(10, [[b.name, 20], [c.name, 30]])
  const forward = records(translateY(calcMultiply(left, right)))
  const reverse = records(translateY(calcMultiply(right, left)))
  expect(forward.map(([path]) => JSON.stringify(path)).sort()).toEqual(reverse.map(([path]) => JSON.stringify(path)).sort())
  expect(forward.find(([path]) => path.includes(a.condition.header) && path.includes(c.condition.header))?.[2]).toBe('translateY(calc(2 * 30))')
  expect(reverse.find(([path]) => path.includes(a.condition.header) && path.includes(c.condition.header))?.[2]).toBe('translateY(calc(30 * 2))')
})

test('同一激活集合内所有 Value 都取自身最高优先级分支', () => {
  const left = value(1, [[a.name, 2], [b.name, 3]])
  const right = value(10, [[a.name, 20], [b.name, 30]])
  const combined = records(calcMultiply(left, right)).filter(([path]) => path.length === 3)
  expect(combined).toEqual([[['.Subject', a.condition.header, b.condition.header], 'width', 'calc(3 * 30)']])
})

test('selector、媒体和容器由已有 CSS 记录逐层嵌套', () => {
  for (const other of [c, container]) {
    const expression = calcMultiply(value('2px', [[a.name, '4px']]), value(2, [[other.name, 3]]))
    const css = compileRules([[[condition('.Subject')], 'width', expression]])
    expect(css).toBe(`.Subject {\nwidth: calc(2px * 2);\n${a.condition.header} {\nwidth: calc(4px * 2);\n}\n${other.condition.header} {\nwidth: calc(2px * 3);\n}\n${a.condition.header} {\n${other.condition.header} {\nwidth: calc(4px * 3);\n}\n}\n}`)
    expect(css).not.toContain(`${a.condition.header}${other.condition.header}`)
  }
})

test('普通 Rule Path 保留顺序和重复，同名 Subject Condition 仅规范自己的部分', () => {
  const path = [condition('.Subject'), b.condition, a.condition, a.condition]
  const output = records(calcMultiply(value(1, [[b.name, 2]]), value(3, [[a.name, 4]])), path)
  expect(output.every(([headers]) => JSON.stringify(headers.slice(0, 4)) === JSON.stringify(path.map((entry) => entry.header)))).toBe(true)
  expect(output.some(([headers]) => JSON.stringify(headers) === JSON.stringify([...path, a.condition, b.condition].map((entry) => entry.header)))).toBe(true)
})

test('Variable 的 A/B 只改写自身，普通 Value 的 B/C 决定消费声明', () => {
  const reference = variable('subject-left', { fallback: value(1, [[a.name, 2], [b.name, 3]]) })
  const right = value(10, [[b.name, 20], [c.name, 30]])
  const output = records(calcMultiply(reference, right))
  expect(output.filter(([, key]) => key === 'width')).toEqual([
    [['.Subject'], 'width', 'calc(var(--subject-left, 1) * 10)'],
    [['.Subject', b.condition.header], 'width', 'calc(var(--subject-left, 1) * 20)'],
    [['.Subject', c.condition.header], 'width', 'calc(var(--subject-left, 1) * 30)'],
    [['.Subject', b.condition.header, c.condition.header], 'width', 'calc(var(--subject-left, 1) * 30)'],
  ])
  const css = compileRules([[[condition('.Subject')], 'width', calcMultiply(reference, right)]])
  expect(css).toContain(`${a.condition.header} {\n--subject-left: 2;\n}`)
  expect(css.match(/width:/g)).toHaveLength(4)
  expect(css).not.toContain(`${a.condition.header} {\n${c.condition.header}`)
})

test('两个 Variable 的条件均停在自身，消费声明只输出一次', () => {
  const left = variable('subject-left', { fallback: value(1, [[a.name, 2]]) })
  const right = variable('subject-right', { fallback: value(10, [[c.name, 30]]) })
  const css = compileRules([[[condition('.Subject')], 'width', calcMultiply(left, right)]])
  expect(css.match(/width:/g)).toHaveLength(1)
  expect(css).toContain('width: calc(var(--subject-left, 1) * var(--subject-right, 10));')
  expect(css).toContain(`${a.condition.header} {\n--subject-left: 2;`)
  expect(css).toContain(`${c.condition.header} {\n--subject-right: 30;`)
})

test('Variable fallback 直接取内容，不需要空 Rules 包装', () => {
  const reference = variable('subject-empty-path', { fallback: 2 })
  expect(records(reference)).toEqual([[['.Subject'], 'width', 'var(--subject-empty-path, 2)']])
})

test('Variable 显式覆盖也拒绝未知名称，undefined 只代表 default', () => {
  const reference = variable('subject-explicit')
  expect(() => compileRules([[[condition('.Subject')], reference, [['unknown-variable-branch', 2]]]])).toThrow('未知 Subject Condition')
  expect(compileRules([[[condition('.Subject')], reference, [[undefined, 1], [a.name, 2]]]])).toBe(`.Subject {\n--subject-explicit: 1;\n${a.condition.header} {\n--subject-explicit: 2;\n}\n}`)
})
