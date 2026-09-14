/** 在浏览器中检查样式生效、按需注册、去重和失败重试。 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { Content, Rule } from './css-block'
import { frame, keyframes } from './css-block/keyframe'
import { media } from './css-block/media'
import { styleRule, type StyleNode } from './css-block/style'
import { declaration } from './css-declaration'
import { key } from './css-key'
import { cssRoot, Root } from './css-root'
import { value } from './css-value'
import { variable } from './css-variable'
import { boxShadow } from '../tokens/css-properties/box-shadow'
import { border } from '../tokens/css-properties/border'
import { padding } from '../tokens/css-properties/padding'
import { margin, marginLeft } from '../tokens/css-properties/margin'
import { bgColor } from '../tokens/css-variables/surface'

const opacityKey = key('opacity')
const animationNameKey = key('animation-name')
const animationDurationKey = key('animation-duration')
const animationPlayStateKey = key('animation-play-state')
const colorKey = key('color')
const retryGapKey = key('--retry-gap')
const backgroundColorKey = key('background-color')

let style: HTMLStyleElement
let element: HTMLDivElement
let root: Root

beforeEach(() => {
  style = document.createElement('style')
  style.id = 'css-root'
  style.textContent = '.existing { color: red; }'
  document.head.append(style)
  element = document.createElement('div')
  element.className = 'token-example'
  document.body.append(element)
  root = new Root()
})

afterEach(() => {
  element.remove()
  style.remove()
  vi.restoreAllMocks()
})

test('递归片段在定义时保留顺序与引用，复合值沿同一激活波注册', () => {
  const active = vi.fn()
  const distance = value('12px', { onActive: active })
  const horizontal = value('20px')
  const left = marginLeft(horizontal)
  const fragment = [margin(distance), [left]]
  const selector = styleRule('.token-example')
  let nested: Content<StyleNode> = fragment
  for (let depth = 0; depth < 10000; depth++) nested = [nested]
  const stroke = variable('fragment-stroke', {
    registration: { syntax: '<length>', inherits: false, initialValue: value('2px') },
  })
  const appearance = selector(
    nested,
    padding(distance, horizontal),
    padding({ left: distance }),
    border('blue', stroke, 'solid'),
    boxShadow(value('black 0px 1px 2px')),
  )
  const other = selector(left)
  expect(other.body).toEqual([left])
  expect(selector(fragment).parseCss()).toBe(selector(margin(distance), left).parseCss())
  fragment.length = 0
  expect(appearance.body[4]).toBe(left)
  expect(cssRoot.activate(appearance)).toBe(cssRoot)
  expect(active).toHaveBeenCalledTimes(1)
  expect(appearance.body[0].kind).toBe('declaration')
  expect(style.sheet!.cssRules).toHaveLength(3)
  expect(style.sheet!.cssRules[0].cssText).toContain('.existing')
  const computed = getComputedStyle(element)
  expect(computed.marginTop).toBe('12px')
  expect(computed.marginRight).toBe('12px')
  expect(computed.marginBottom).toBe('12px')
  expect(computed.marginLeft).toBe('20px')
  expect(computed.boxShadow).not.toBe('none')
  expect(computed.paddingTop).toBe('12px')
  expect(computed.paddingRight).toBe('20px')
  expect(computed.paddingBottom).toBe('12px')
  expect(computed.paddingLeft).toBe('12px')
  expect(computed.borderTopWidth).toBe('2px')
  expect(computed.borderTopStyle).toBe('solid')
  expect(computed.borderTopColor).toBe('rgb(0, 0, 255)')
})

test('同一个变量在不同作用域定义不同值，定义和使用共同按需注册', () => {
  const assignedActive = vi.fn()
  const fallback = value('4px')
  const shared = variable('shared-space', {
    fallback,
    registration: { syntax: '<length>', inherits: false, initialValue: value('2px') },
  })
  const registered = vi.spyOn(shared, 'onActive')
  const use = padding(shared)
  const other = document.createElement('input')
  other.className = 'other-scope'
  element.append(other)
  const definition = styleRule('.token-example')(shared(value('12px', { onActive: assignedActive })))
  expect(registered).not.toHaveBeenCalled()
  root.activate(definition)
  expect(registered).toHaveBeenCalledTimes(1)
  expect(assignedActive).toHaveBeenCalledTimes(1)
  root.activate(styleRule('.token-example')(use), styleRule('.other-scope')(shared(value('20px')), use))
  expect(getComputedStyle(element).paddingLeft).toBe('12px')
  expect(getComputedStyle(other).paddingLeft).toBe('20px')
  expect(shared.fallback).toBe(fallback)
  const ruleCount = style.sheet!.cssRules.length
  other.style.setProperty('--shared-space', '24px')
  expect(getComputedStyle(other).paddingLeft).toBe('24px')
  expect(getComputedStyle(element).paddingLeft).toBe('12px')
  expect(style.sheet!.cssRules).toHaveLength(ruleCount)
  expect(registered).toHaveBeenCalledTimes(1)
})

test('同一个 Root 对 Value 和顶层 Block 均按对象身份幂等', () => {
  const active = vi.fn()
  const opacity = value(0.5, { onActive: active })
  const first = styleRule('.token-example')([declaration(opacityKey, opacity)])
  const second = styleRule('.other')([declaration(opacityKey, opacity)])
  root.activate([first, first, second])
  root.activate([first, second])
  expect(active).toHaveBeenCalledTimes(1)
  expect(style.sheet!.cssRules).toHaveLength(3)
  expect('isActive' in opacity).toBe(false)
  new Root().activate(first)
  expect(active).toHaveBeenCalledTimes(2)
  expect(style.sheet!.cssRules).toHaveLength(4)
})

test('变量初次消费在同一调用注册 @property，初值及类型约束实际生效', () => {
  const gap = variable('registered-gap', {
    registration: { syntax: '<length>', inherits: false, initialValue: value('8px') },
  })
  const appearance = styleRule('.token-example')([marginLeft(gap)])
  expect(style.sheet!.cssRules).toHaveLength(1)
  root.activate([appearance, appearance])
  expect(Array.from(style.sheet!.cssRules).filter((rule) => rule.cssText.startsWith('@property'))).toHaveLength(1)
  expect(getComputedStyle(element).marginLeft).toBe('8px')
  element.style.setProperty('--registered-gap', '13px')
  expect(getComputedStyle(element).marginLeft).toBe('13px')
  element.style.setProperty('--registered-gap', 'red')
  expect(getComputedStyle(element).marginLeft).toBe('8px')
  expect(style.sheet!.cssRules).toHaveLength(3)
})

test('动画名称返回 Keyframes，帧内变量继续注册并在同一激活波生效', () => {
  const initialActive = vi.fn(() => {
    expect(style.sheet!.cssRules).toHaveLength(1)
  })
  const opacity = variable('frame-opacity', {
    registration: { syntax: '<number>', inherits: false, initialValue: value(0.25, { onActive: initialActive }) },
  })
  let animationRules: Rule
  const nameActive = vi.fn(() => animationRules)
  const animationName = value('token-fade', { onActive: nameActive })
  animationRules = keyframes(animationName, [
    frame('from', [declaration(opacityKey, opacity)]),
    frame('to', [declaration(opacityKey, value(1))]),
  ])
  root.activate(
    styleRule('.token-example')([
      declaration(animationNameKey, animationName),
      declaration(animationDurationKey, value('10s')),
      declaration(animationPlayStateKey, value('paused')),
    ]),
  )
  expect(nameActive).toHaveBeenCalledTimes(1)
  expect(initialActive).toHaveBeenCalledTimes(1)
  expect(style.sheet!.cssRules).toHaveLength(4)
  expect(Array.from(style.sheet!.cssRules).filter((rule) => rule.cssText.startsWith('@keyframes'))).toHaveLength(1)
  expect(getComputedStyle(element).animationName).toBe('token-fade')
  expect(getComputedStyle(element).opacity).toBe('0.25')
})

test('递归回到入口 Block 及共享新增 Block 时终止且只注册一次', () => {
  let first: Rule
  let second: Rule
  const activateFirst = vi.fn(() => first)
  const activateSecond = vi.fn(() => second)
  first = styleRule('.token-example')([declaration(opacityKey, value(0.5, { onActive: activateSecond }))])
  second = styleRule('.other')([declaration(opacityKey, value(1, { onActive: activateFirst }))])
  root.activate([first, styleRule('.third')([declaration(opacityKey, value(1, { onActive: activateSecond }))])])
  expect(activateFirst).toHaveBeenCalledTimes(1)
  expect(activateSecond).toHaveBeenCalledTimes(2)
  expect(style.sheet!.cssRules).toHaveLength(4)
})

test('嵌套和媒体内部的 Value 经真实结构激活并保留原生层次', () => {
  const active = vi.fn()
  const blue = value('rgb(0, 0, 255)', { onActive: active })
  root.activate([
    styleRule('.empty')(),
    media('(min-width: 1px)', [styleRule('.token-example')([styleRule('&')([declaration(colorKey, blue)])])]),
  ])
  expect(active).toHaveBeenCalledTimes(1)
  expect(style.sheet!.cssRules[2].cssText).toContain('@media')
  expect(getComputedStyle(element).color).toBe('rgb(0, 0, 255)')
})

test('CSS 只追加，DOM 状态和局部变量改变视觉结果而不重写样式表', () => {
  const first = styleRule('.token-example')([marginLeft(variable('local-gap', { fallback: value('2px') }))])
  root.activate(first)
  const originalRule = style.sheet!.cssRules[1]
  const originalCss = originalRule.cssText
  root.activate(styleRule('.token-example[data-state="wide"]')([marginLeft(value('20px'))]))
  expect(style.sheet!.cssRules[1]).toBe(originalRule)
  element.style.setProperty('--local-gap', '12px')
  expect(getComputedStyle(element).marginLeft).toBe('12px')
  element.dataset.state = 'wide'
  expect(getComputedStyle(element).marginLeft).toBe('20px')
  root.activate(first)
  expect(style.sheet!.cssRules).toHaveLength(3)
  expect(originalRule.cssText).toBe(originalCss)
})

test('固定承载节点缺失时先失败，不执行 onActive，恢复后能够首次激活', () => {
  const active = vi.fn()
  const appearance = styleRule('.token-example')([marginLeft(value('2px', { onActive: active }))])
  style.remove()
  expect(() => root.activate(appearance)).toThrow('缺少样式挂载节点')
  expect(active).not.toHaveBeenCalled()
  expect(document.getElementById('css-root')).toBeNull()
  document.head.append(style)
  root.activate(appearance)
  expect(active).toHaveBeenCalledTimes(1)
})

test('浏览器插入异常不会把失败的 Block 记为成功注册', () => {
  const active = vi.fn()
  const appearance = styleRule('.token-example')([marginLeft(value('3px', { onActive: active }))])
  vi.spyOn(style.sheet!, 'insertRule').mockImplementationOnce(() => {
    throw new Error('测试插入失败')
  })
  expect(() => root.activate(appearance)).toThrow('测试插入失败')
  root.activate(appearance)
  expect(active).toHaveBeenCalledTimes(1)
  expect(style.sheet!.cssRules).toHaveLength(2)
  expect(getComputedStyle(element).marginLeft).toBe('3px')
})

test('入口插入成功但依赖失败时，再激活入口会补齐依赖且不重复入口', () => {
  const dependencyActive = vi.fn()
  const registration = styleRule(':root')([declaration(retryGapKey, value('9px', { onActive: dependencyActive }))])
  const active = vi.fn(() => registration)
  const appearance = styleRule('.token-example')([marginLeft(value('var(--retry-gap, 2px)', { onActive: active }))])
  const sheet = style.sheet!
  vi.spyOn(sheet, 'insertRule')
    .mockImplementationOnce((css, index) => CSSStyleSheet.prototype.insertRule.call(sheet, css, index))
    .mockImplementationOnce(() => {
      throw new Error('测试依赖插入失败')
    })
  expect(() => root.activate(appearance)).toThrow('测试依赖插入失败')
  expect(sheet.cssRules).toHaveLength(2)
  const insertedAppearance = sheet.cssRules[1]
  expect(getComputedStyle(element).marginLeft).toBe('2px')
  root.activate(appearance)
  expect(sheet.cssRules).toHaveLength(3)
  expect(sheet.cssRules[1]).toBe(insertedAppearance)
  expect(active).toHaveBeenCalledTimes(1)
  expect(dependencyActive).toHaveBeenCalledTimes(1)
  expect(getComputedStyle(element).marginLeft).toBe('9px')
})

test('正式颜色 Token 保留嵌套混色及兜底变量的按需注册', () => {
  element.style.setProperty('--dye-neutral-1', 'blue')
  element.style.setProperty('--color-accent-soft', 'red')
  root.activate(styleRule('.token-example')([declaration(backgroundColorKey, bgColor)]))
  const registrations = Array.from(style.sheet!.cssRules).filter((rule) => rule.cssText.startsWith('@property'))
  expect(registrations).toHaveLength(2)
  expect(registrations.map((rule) => rule.cssText).join('\n')).toContain('--surface-color')
  expect(getComputedStyle(element).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
})
