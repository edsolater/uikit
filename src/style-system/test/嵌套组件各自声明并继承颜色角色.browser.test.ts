/** 验证共享组件颜色角色由各选择器声明，并按原生 CSS 作用域传给嵌套内容。 */
import { declare } from '../declaration'
import { key } from '../key'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { cssRoot } from '../css-root'
import { rules, type RulesHandle } from '../rule'
import { contentColor, surfaceColor } from '../pieces/roles/color'

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
  handles.push(rules('.first-component', [declare(surfaceColor, 'rgb(10, 20, 30)'), declare(contentColor, 'rgb(240, 241, 242)')]))
  handles.push(rules('.second-component', [declare(surfaceColor, 'rgb(210, 220, 230)'), declare(contentColor, 'rgb(40, 41, 42)')]))
  handles.push(rules('.component-content', [[key("background-color"), surfaceColor], [key("color"), contentColor]]))
  cssRoot.mount()

  const first = document.body.appendChild(document.createElement('div'))
  first.className = 'first-component component-content'
  const firstContent = first.appendChild(document.createElement('span'))
  firstContent.className = 'component-content'
  const second = first.appendChild(document.createElement('div'))
  second.className = 'second-component component-content'
  const secondContent = second.appendChild(document.createElement('span'))
  secondContent.className = 'component-content'

  const normalized = (content: string) => {
    const reference = document.body.appendChild(document.createElement('div'))
    reference.style.color = content
    const result = getComputedStyle(reference).color
    reference.remove()
    return result
  }
  expect(getComputedStyle(first).backgroundColor).toBe(normalized('rgb(10, 20, 30)'))
  expect(getComputedStyle(first).color).toBe(normalized('rgb(240, 241, 242)'))
  expect(getComputedStyle(firstContent).backgroundColor).toBe(normalized('rgb(10, 20, 30)'))
  expect(getComputedStyle(firstContent).color).toBe(normalized('rgb(240, 241, 242)'))
  expect(getComputedStyle(second).backgroundColor).toBe(normalized('rgb(210, 220, 230)'))
  expect(getComputedStyle(second).color).toBe(normalized('rgb(40, 41, 42)'))
  expect(getComputedStyle(secondContent).backgroundColor).toBe(normalized('rgb(210, 220, 230)'))
  expect(getComputedStyle(secondContent).color).toBe(normalized('rgb(40, 41, 42)'))
})
