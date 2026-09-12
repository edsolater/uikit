/** 验证实际对象经固定根挂载后的浏览器样式及激活身份。 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { value } from './derive/css-value'
import { block } from './css-block'
import { root } from './css-root'
import { selector } from './derive/css-selector'
import { property } from './derive/css-property'
import { variable } from './derive/css-variable'
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
  root.children.length = 0
})

test('唯一 Selector 直接挂载，Root 与业务持有同一对象', () => {
  const active = vi.fn()
  const foreground = variable('foreground', value('rgb(0, 0, 255)', { onActive: active }))
  const color = property('color', foreground)
  const button = selector('.token-example').attach(color)
  const input = selector('.other-example').attach(color)
  expect(button.isActive).toBe(false)
  root.attach(button, input)
  expect(root.children).toEqual([button, input])
  expect(root.children[0]).toBe(button)
  expect(button.children[0]).toBe(input.children[0])
  expect(color.value).toBe(foreground)
  expect(foreground.isActive).toBe(true)
  expect(active).toHaveBeenCalledTimes(1)
  expect(getComputedStyle(element).color).toBe('rgb(0, 0, 255)')
  expect(style.sheet!.cssRules.length).toBe(3)
  expect(style.sheet!.cssRules[0].cssText).toContain('.existing')
})

test('根接受多个对象及重复引用，不隐式派生或覆写对象索引', () => {
  const appearance = selector('.token-example').attach(margin(value('7px')))
  expect(root.attach()).toBe(root)
  expect(root.attach(appearance, appearance)).toBe(root)
  expect(root.children[0]).toBe(appearance)
  expect(root.children[1]).toBe(appearance)
  expect('parent' in appearance).toBe(false)
  expect('index' in appearance).toBe(false)
  expect(style.sheet!.cssRules.length).toBe(3)
  expect(getComputedStyle(element).marginTop).toBe('7px')
})

test('离线组合不解析，六个基础 Token 挂载后按原生顺序生效', () => {
  const active = vi.fn()
  const distance = value('12px', { onActive: active })
  const parse = vi.spyOn(distance, 'parseCss')
  const appearance = block().attach(margin(distance), marginLeft(value('20px')))
    .attach(boxShadow(value('rgb(0, 0, 0) 0px 1px 2px')))
  const button = selector('.token-example').attach(appearance)
  expect(parse).not.toHaveBeenCalled()
  expect(active).not.toHaveBeenCalled()
  expect(style.sheet!.cssRules.length).toBe(1)
  expect('activate' in root).toBe(false)
  root.attach(button)
  const computed = getComputedStyle(element)
  expect(computed.marginTop).toBe('12px')
  expect(computed.marginRight).toBe('12px')
  expect(computed.marginBottom).toBe('12px')
  expect(computed.marginLeft).toBe('20px')
  expect(computed.boxShadow).not.toBe('none')
  expect(active).toHaveBeenCalledTimes(1)
})

test('挂载时读取当前对象内容，显式派生的修改只作用于其选择器', () => {
  const distance = value('2px')
  const base = selector('.unused').attach(margin(distance))
  const button = base()
  button.selector = '.token-example'
  distance.raw = '18px'
  root.attach(button)
  expect(base.isActive).toBe(false)
  expect(button.isActive).toBe(true)
  expect(base.selector).toBe('.unused')
  expect(root.children[0]).toBe(button)
  expect(getComputedStyle(element).marginTop).toBe('18px')
})

test('共享依赖首次激活可挂载全局规则，不移入消费选择器', () => {
  const registration = selector(':where(:hover)').attach(property('--token-shadow', value('none')))
  const activate = vi.fn(() => root.attach(registration))
  const shadow = variable('token-shadow', value('none'))
  shadow.onActive = activate
  const appearance = selector('.token-example').attach(boxShadow(shadow))
  root.attach(appearance, selector('.other-example').attach(boxShadow(shadow)))
  expect(activate).toHaveBeenCalledTimes(1)
  expect(style.sheet!.cssRules[1].cssText).toContain(':where(:hover)')
  expect(style.sheet!.cssRules[1].cssText).not.toContain('.token-example')
  expect(root.children[0]).toBe(registration)
  expect(getComputedStyle(element).boxShadow).toBe('none')
})

test('固定节点缺失时失败，不激活内容或创建替代节点', () => {
  style.remove()
  const active = vi.fn()
  const appearance = selector('.token-example').attach(margin(value('2px', { onActive: active })))
  expect(() => root.attach(appearance)).toThrow('缺少样式挂载节点')
  expect(active).not.toHaveBeenCalled()
  expect(appearance.isActive).toBe(false)
  expect(document.getElementById('css-root')).toBeNull()
})

test('空规则可挂载，嵌套规则保留结构和实际样式', () => {
  const empty = selector('.empty')
  const appearance = selector('.token-example').attach(
    selector('&').attach(property('color', value('rgb(0, 0, 255)'))),
    property('opacity', value(0.5)),
  )
  root.attach(empty, appearance)
  expect(style.sheet!.cssRules[1].cssText).toContain('.empty')
  expect(style.sheet!.cssRules[2].cssText).toContain('&')
  expect(getComputedStyle(element).color).toBe('rgb(0, 0, 255)')
  expect(getComputedStyle(element).opacity).toBe('0.5')
})

test('接通后追加对象更新内部结构并激活，不冒充已经同步 CSSOM', () => {
  const appearance = selector('.token-example').attach(marginLeft(value('2px')))
  root.attach(appearance)
  const before = style.sheet!.cssRules[1].cssText
  const late = marginLeft(value('20px'))
  appearance.attach(late)
  expect(late.isActive).toBe(true)
  expect(appearance.children.at(-1)).toBe(late)
  expect(appearance.parseCss()).toContain('20px')
  expect(style.sheet!.cssRules[1].cssText).toBe(before)
  expect(getComputedStyle(element).marginLeft).toBe('2px')
})
