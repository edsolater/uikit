/** 验证共享组件颜色角色由各选择器声明，并按原生 CSS 作用域传给嵌套内容。 */
import { key } from '../css-key'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { cssRoot, rules, type RulesHandle } from '../index'
import { foregroundColor, surfaceColor } from '../materials/roles/color'

let style: HTMLStyleElement
const handles: RulesHandle[] = []

beforeEach(() => {
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
})

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
  document.body.replaceChildren()
  style.remove()
})

test('嵌套组件重新声明同一角色，组件自身与未重定义内容取得各自当前值', () => {
  handles.push(rules('.first-component', [[surfaceColor, 'rgb(10, 20, 30)'], [foregroundColor, 'rgb(240, 241, 242)']]))
  handles.push(rules('.second-component', [[surfaceColor, 'rgb(210, 220, 230)'], [foregroundColor, 'rgb(40, 41, 42)']]))
  handles.push(rules('.component-content', [[key("background-color"), surfaceColor], [key("color"), foregroundColor]]))
  cssRoot.mount()

  const first = document.body.appendChild(document.createElement('div'))
  first.className = 'first-component component-content'
  const firstContent = first.appendChild(document.createElement('span'))
  firstContent.className = 'component-content'
  const second = first.appendChild(document.createElement('div'))
  second.className = 'second-component component-content'
  const secondContent = second.appendChild(document.createElement('span'))
  secondContent.className = 'component-content'

  expect(getComputedStyle(first).backgroundColor).toBe('rgb(10, 20, 30)')
  expect(getComputedStyle(first).color).toBe('rgb(240, 241, 242)')
  expect(getComputedStyle(firstContent).backgroundColor).toBe('rgb(10, 20, 30)')
  expect(getComputedStyle(firstContent).color).toBe('rgb(240, 241, 242)')
  expect(getComputedStyle(second).backgroundColor).toBe('rgb(210, 220, 230)')
  expect(getComputedStyle(second).color).toBe('rgb(40, 41, 42)')
  expect(getComputedStyle(secondContent).backgroundColor).toBe('rgb(210, 220, 230)')
  expect(getComputedStyle(secondContent).color).toBe('rgb(40, 41, 42)')
})
