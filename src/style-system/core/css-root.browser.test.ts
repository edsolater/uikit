/** 验证基础 Token 组合后经固定根输出真实样式。 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { cssBlock } from './css-block'
import { cssRoot } from './css-root'
import { cssSelector } from './derive/css-selector'
import { boxShadow, margin, marginLeft } from '../tokens/base-css'

let style: HTMLStyleElement
let element: HTMLDivElement

beforeEach(() => {
  style = document.createElement('style')
  style.id = 'css-root'
  style.textContent = '.existing { color: red; }'
  document.head.append(style)
  element = document.createElement('div')
  element.className = 'token-example'
  document.body.append(element)
})

afterEach(() => {
  element.remove()
  style.remove()
})

test('根一次接收多个 Block，遇到重复项仍继续挂载后续项', () => {
  const first = cssSelector('.token-example').attach(margin(cssBlock('7px')))
  const second = cssSelector('.token-example').attach(boxShadow(cssBlock('none')))
  expect(cssRoot.attach()).toBe(cssRoot)
  expect(cssRoot.attach(first, first, second)).toBe(cssRoot)
  expect(style.sheet!.cssRules.length).toBe(3)
  expect(getComputedStyle(element).marginTop).toBe('7px')
})

test('离线组合不转换，挂载后六个 Token 的组合实际生效', () => {
  const output = vi.fn(() => '12px')
  const activate = vi.fn()
  const distance = cssBlock(output, { onActive: activate })
  const appearance = cssBlock().attach(margin(distance)).attach(marginLeft(cssBlock('20px')))
    .attach(boxShadow(cssBlock('rgb(0, 0, 0) 0px 1px 2px')))
  const selector = cssSelector('.token-example').attach(appearance)
  expect(output).not.toHaveBeenCalled()
  expect(activate).not.toHaveBeenCalled()
  expect(style.sheet!.cssRules.length).toBe(1)
  expect('activate' in cssRoot).toBe(false)
  expect(cssRoot.attach(selector)).toBe(cssRoot)
  const computed = getComputedStyle(element)
  expect(computed.marginTop).toBe('12px')
  expect(computed.marginRight).toBe('12px')
  expect(computed.marginBottom).toBe('12px')
  expect(computed.marginLeft).toBe('20px')
  expect(computed.boxShadow).not.toBe('none')
  expect(activate).toHaveBeenCalledTimes(1)
  expect(style.sheet!.cssRules[0].cssText).toContain('.existing')
  cssRoot.attach(selector)
  expect(style.sheet!.cssRules.length).toBe(2)
})

test('值在离线组合后修改，首次挂载使用最新值', () => {
  const distance = cssBlock('2px')
  const spacing = margin(distance)
  const selector = cssSelector('.token-example').attach(spacing)
  distance.setValue('18px')
  cssRoot.attach(selector)
  expect(getComputedStyle(element).marginTop).toBe('18px')
})

test('依赖激活可以挂载全局规则，不改变其选择器作用域', () => {
  const registration = cssBlock(':where(:hover) { --token-shadow: none; }')
  const activate = vi.fn(() => cssRoot.attach(registration))
  const shadow = boxShadow(cssBlock('var(--token-shadow, none)', { onActive: activate }))
  const selector = cssSelector('.token-example').attach(shadow)
  cssRoot.attach(selector)
  expect(activate).toHaveBeenCalledTimes(1)
  expect(style.sheet!.cssRules[1].cssText).toContain(':where(:hover)')
  expect(style.sheet!.cssRules[1].cssText).not.toContain('.token-example')
  expect(getComputedStyle(element).boxShadow).toBe('none')
})

test('固定节点缺失时明确失败，不激活内容或创建替代节点', () => {
  style.remove()
  const activate = vi.fn()
  const value = cssBlock('2px', { onActive: activate })
  const spacing = margin(value)
  const selector = cssSelector('.token-example').attach(spacing)
  expect(() => cssRoot.attach(selector)).toThrow('缺少样式挂载节点')
  expect(activate).not.toHaveBeenCalled()
  expect(document.getElementById('css-root')).toBeNull()
})
