/** Variable 基础输入的编译消费验证。

检查同一默认配方的独立绑定、状态和实际名称依赖。

防止绑定提前求值、子体互相覆盖或未使用的基础进入依赖链。
*/
import { expect, test, vi } from 'vitest'
import { compileRules } from '../css-root'
import { variable } from '../variable'
import { colorMix } from '../pieces/contents/functions/color-mix'
import { multiply } from '../pieces/contents/functions/calc'
import { declare } from '../operations/declare'
import type { ValueInput } from '../value'

test('创建和绑定不执行默认配方，两个基础分别生成独立变量', () => {
  const produce = vi.fn(base => colorMix([base, 0.18], 'transparent'))
  const line = variable(produce, 'based-line-recipe')
  const surface = variable('white', 'based-surface')
  const content = variable('black', 'based-content')
  const surfaceLine = line.baseOn(surface)
  const contentLine = line.baseOn(content)
  expect(produce).not.toHaveBeenCalled()
  expect(surfaceLine).not.toBe(line)
  expect(surfaceLine.toCSSString()).not.toBe(contentLine.toCSSString())
  expect(surfaceLine.toCSSString()).not.toBe(line.toCSSString())

  const css = compileRules([[['.Surface'], 'border-color', surfaceLine], [['.Content'], 'border-color', contentLine.name]])
  expect(css).toContain(`${surfaceLine.toCSSString()}: color-mix(in oklab, var(--based-surface) 18%, transparent);`)
  expect(css).toContain(`${contentLine.toCSSString()}: color-mix(in oklab, var(--based-content) 18%, transparent);`)
  expect(css).not.toContain('--based-line-recipe:')
})

test('无绑定时无参执行，有绑定时传入基础，失败从消费处抛出', () => {
  const produce = vi.fn((base?: string) => base ?? '4px')
  const size = variable(produce, 'based-optional-size')
  expect(compileRules([[['.Unbound'], 'width', size]])).toContain('--based-optional-size: 4px;')
  expect(produce).toHaveBeenCalledWith()
  const bound = size.baseOn('8px')
  expect(compileRules([[['.Bound'], 'width', bound]])).toContain(`${bound.toCSSString()}: 8px;`)
  expect(produce).toHaveBeenCalledWith('8px')
  const empty = size.baseOn(undefined)
  expect(compileRules([[['.Empty'], 'width', empty]])).toContain(`${empty.toCSSString()}: 4px;`)
  expect(produce).toHaveBeenCalledWith(undefined)

  const invalid = variable(() => { throw new Error('基础配方失败') }, 'based-failed-recipe')
  const failed = invalid.baseOn('red')
  expect(() => compileRules([[['.Failed'], 'color', failed]])).toThrow('基础配方失败')
})

test('配方忽略基础而输出常量时，不激活未使用的基础名称', () => {
  const unused = variable(() => { throw new Error('未使用的基础不能消费') }, 'based-unused-source')
  const fixed = variable(() => 'red', 'based-fixed-recipe').baseOn(unused)
  const css = compileRules([[['.Fixed'], 'color', fixed]])
  expect(css).toContain(`${fixed.toCSSString()}: red;`)
  expect(css).not.toContain('--based-unused-source')
})

test('默认参数和剩余参数生产函数按实际绑定执行，不按声明参数数量分类', () => {
  const defaulted = variable((base = '2px') => multiply(base, 2), 'based-default-parameter')
  const rest = variable((...inputs: string[]) => inputs[0] ?? '3px', 'based-rest-parameter')
  const selected = defaulted.baseOn('5px')
  const collected = rest.baseOn('7px')
  const multiple = variable((base: ValueInput, _unused: number) => multiply(base, 2), 'based-multiple-parameters').baseOn('9px')
  const css = compileRules([[['.Default'], 'width', selected], [['.Rest'], 'width', collected], [['.Multiple'], 'width', multiple]])
  expect(css).toContain(`${selected.toCSSString()}: calc(5px * 2);`)
  expect(css).toContain(`${collected.toCSSString()}: 7px;`)
  expect(css).toContain(`${multiple.toCSSString()}: calc(9px * 2);`)
})

test('绑定保留可调用内容协议，常量默认内容不被基础替换', () => {
  const callable = Object.assign(() => { throw new Error('内容对象不能作为生产函数执行') }, { toCSSString: () => '7px' })
  const content = variable(callable, 'based-callable').baseOn('9px')
  const fixed = variable('5px', 'based-constant').baseOn('9px')
  const css = compileRules([[['.Content'], 'width', content], [['.Content'], 'height', fixed]])
  expect(css).toContain(`${content.toCSSString()}: 7px;`)
  expect(css).toContain(`${fixed.toCSSString()}: 5px;`)
})

test('创建时继承默认配方和状态，状态仍绑定子体的本次声明基础', () => {
  const source = variable(base => multiply(base, 2), { name: 'based-state-recipe', states: { hover: base => multiply(base, 3) } })
  const child = source.baseOn('4px')
  source.config.defaultValue = '100px'
  source.config.states.clear()
  const css = compileRules([[['.State'], 'width', child]])
  expect(css).toContain(`${child.toCSSString()}: calc(4px * 2);`)
  expect(css).toContain(`${child.toCSSString()}: calc(calc(4px * 2) * 3);`)
  expect(css).not.toContain('100px')
  const local = compileRules([[['.Local'], ...declare(child, '6px')], [['.Local'], 'width', child]])
  expect(local).toContain(`${child.toCSSString()}: calc(6px * 3);`)
})

test('对子体再次绑定继承当前默认内容，不解开已有绑定闭包', () => {
  const recipe = variable(base => multiply(base, 2), 'based-chain-recipe')
  const first = recipe.baseOn('3px')
  const second = first.baseOn('5px')
  const css = compileRules([[['.First'], 'width', first], [['.Second'], 'width', second]])
  expect(css).toContain(`${first.toCSSString()}: calc(3px * 2);`)
  expect(css).toContain(`${second.toCSSString()}: calc(3px * 2);`)
})
