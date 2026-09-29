/** 在真实浏览器验证默认组合、状态地址、重挂载和无效组合值。 */
import { afterEach, beforeEach, expect, test } from 'vitest'
import { condition } from '../condition'
import { cssRoot } from '../css-root'
import { key } from '../key'
import { $boxShadow } from '../pieces/keys/box-shadow'
import { stateCondition } from '../pieces/state-conditions'
import { rule, rules, type RulesHandle } from '../rule'

stateCondition('shadowHover', condition('&:where([data-shadow-hover])'))
stateCondition('shadowActive', condition('&:where([data-shadow-active])'))

let style: HTMLStyleElement
let element: HTMLDivElement
let handles: RulesHandle[]

beforeEach(() => {
  style = document.createElement('style')
  style.id = 'css-root'
  document.head.append(style)
  element = document.createElement('div')
  element.className = 'aggregate-shadow-example'
  document.body.append(element)
  handles = []
})

afterEach(() => {
  for (const handle of handles) handle.remove()
  element.remove()
  style.remove()
})

test('同址三层阴影按声明顺序计算，状态各自聚合且同时成立仍按层叠选值', () => {
  handles.push(rules('.aggregate-shadow-example', [
    [$boxShadow, '1px 2px red'],
    [$boxShadow, '3px 4px blue, 5px 6px green'],
  ]))
  handles.push(rules(['.aggregate-shadow-example', 'shadowHover'], [
    [$boxShadow, '7px 8px purple'],
    [$boxShadow, '9px 10px orange'],
  ]))
  handles.push(rule(['.aggregate-shadow-example', 'shadowActive'], $boxShadow, '11px 12px black'))
  cssRoot.mount()

  const base = getComputedStyle(element).boxShadow
  expect(base).toContain('rgb(255, 0, 0)')
  expect(base).toContain('rgb(0, 0, 255)')
  expect(base).toContain('rgb(0, 128, 0)')
  expect(base.indexOf('rgb(255, 0, 0)')).toBeLessThan(base.indexOf('rgb(0, 0, 255)'))
  expect(base.indexOf('rgb(0, 0, 255)')).toBeLessThan(base.indexOf('rgb(0, 128, 0)'))

  element.dataset.shadowHover = ''
  const hover = getComputedStyle(element).boxShadow
  expect(hover).toContain('rgb(128, 0, 128)')
  expect(hover).toContain('rgb(255, 165, 0)')
  expect(hover).not.toContain('rgb(255, 0, 0)')

  element.dataset.shadowActive = ''
  expect(getComputedStyle(element).boxShadow).toContain('rgb(0, 0, 0)')
  element.removeAttribute('data-shadow-active')
  element.removeAttribute('data-shadow-hover')
  expect(getComputedStyle(element).boxShadow).toBe(base)
})

test('替换和撤销一项贡献后重挂载，计算值与 CSS 都无旧阴影', () => {
  const first = rule('.aggregate-shadow-example', $boxShadow, '1px 2px red')
  const second = rule('.aggregate-shadow-example', $boxShadow, '3px 4px blue')
  handles.push(first, second)
  cssRoot.mount()
  expect(getComputedStyle(element).boxShadow).toContain('rgb(255, 0, 0)')
  expect(getComputedStyle(element).boxShadow).toContain('rgb(0, 0, 255)')

  first.replace('5px 6px green')
  cssRoot.mount()
  expect(getComputedStyle(element).boxShadow).toContain('rgb(0, 128, 0)')
  expect(getComputedStyle(element).boxShadow).not.toContain('rgb(255, 0, 0)')
  second.remove()
  cssRoot.mount()
  expect(getComputedStyle(element).boxShadow).not.toContain('rgb(0, 0, 255)')
  first.remove()
  cssRoot.mount()
  expect(getComputedStyle(element).boxShadow).toBe('none')
  expect(style.textContent).not.toContain('box-shadow:')
})

test('默认组合产生无效值时浏览器忽略整条声明', () => {
  const margin = key('margin-left')
  handles.push(rules('.aggregate-shadow-example', [[margin, '7px'], [margin, '无效长度']]))
  cssRoot.mount()
  expect(style.textContent).toContain('margin-left: 7px, 无效长度;')
  expect(getComputedStyle(element).marginLeft).toBe('0px')
})
