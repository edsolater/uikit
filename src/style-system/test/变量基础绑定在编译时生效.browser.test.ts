/** 基础绑定的浏览器计算验证。

检查绑定结果沿来源的局部声明和状态计算，并保留自身状态。

CSS 文本正确仍可能因继承位置错误而失效，因此读取浏览器最终尺寸。
*/
import { afterEach, expect, test } from 'vitest'
import { compileRules } from '../css-root'
import { declare } from '../operations/declare'
import { multiply } from '../pieces/contents/functions/calc'
import { variable } from '../variable'

afterEach(() => document.body.replaceChildren())

test.each([false, true])('基础绑定响应局部来源及双方状态，消费 Name=%s', useName => {
  const source = variable('4px', { name: `browser-based-source-${useName}`, states: { '&[data-base]': '9px' } })
  const recipe = variable(base => multiply(base, 2), {
    name: `browser-based-recipe-${useName}`, states: { '&[data-line]': base => multiply(base, 3) },
  })
  const bound = recipe.baseOn(source)
  const css = compileRules([
    [['.Parent'], ...declare(source, '4px')],
    [['.Parent'], 'width', useName ? bound.name : bound],
    [['.Child'], ...declare(source, '7px')],
    [['.Child'], 'width', useName ? bound.name : bound],
  ])
  document.body.appendChild(document.createElement('style')).textContent = css
  const parent = document.body.appendChild(document.createElement('div'))
  parent.className = 'Parent'
  const child = parent.appendChild(document.createElement('div'))
  child.className = 'Child'
  expect(getComputedStyle(parent).width).toBe('8px')
  expect(getComputedStyle(child).width).toBe('14px')
  child.dataset.base = ''
  expect(getComputedStyle(child).width).toBe('18px')
  child.dataset.line = ''
  expect(getComputedStyle(child).width).toBe('54px')
  delete child.dataset.base
  expect(getComputedStyle(child).width).toBe('42px')
  delete child.dataset.line
  expect(getComputedStyle(child).width).toBe('14px')
})
