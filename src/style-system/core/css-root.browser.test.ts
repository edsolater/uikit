/** 在真实浏览器验证全局源规则、按需依赖、重新挂载与失败边界。 */
import { key } from './css-key'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { stateCondition } from '../state-conditions'
import { userEvent } from 'vitest/browser'
import { cssRoot as root } from './css-root'
import { rule, rules, type RulesHandle, type Rules } from './css-rule'
import { condition, media } from './css-condition'
import { value } from './css-value'
import { variable } from './css-variable'
import { declare } from './css-declaration'
import { $margin } from '../properties/margin'
import { $padding } from '../properties/padding'
import { animationName, animationValue } from '../values/animation'
import { calcMultiply } from '../values/functions/calc'
import { cssFunction } from '../values/functions/custom'
import { colorMix } from '../values/functions/color-mix'

stateCondition('testLarge', condition('&[data-large]'))
stateCondition('testMedia', media('(width > 1px)'))
stateCondition('browserA', condition('&:where([data-a])'))
stateCondition('browserB', condition('&:where([data-b])'))

let style: HTMLStyleElement
let element: HTMLDivElement
let handles: RulesHandle[]

beforeEach(() => {
  style = document.createElement('style')
  style.id = 'css-root'
  style.textContent = '.existing { color: red; }'
  document.head.append(style)
  element = document.createElement('div')
  element.className = 'example'
  element.textContent = '样式验证'
  document.body.append(element)
  handles = []
})

afterEach(() => {
  for (const handle of handles) handle.remove()
  element.remove()
  style.remove()
  vi.restoreAllMocks()
})

test('简写与长属性覆盖生效，变量注册与局部定义沿同一次编译', () => {
  const gap = variable('4px', { name: '--space-example', root: { value: '12px' }, registration: { syntax: '<length>', inherits: true, initialValue: '2px' } })
  handles.push(rules('.example', [[$margin, '6px'], declare(key('margin-left'), '10px'), [$padding, gap]]))
  handles.push(rule('.example', gap, '20px'))
  root.mount()
  const computed = getComputedStyle(element)
  expect(computed.marginTop).toBe('6px')
  expect(computed.marginLeft).toBe('10px')
  expect(computed.paddingLeft).toBe('20px')
  expect(style.sheet!.cssRules[0].cssText).toContain('.existing')
  expect(Array.from(style.sheet!.cssRules).filter((entry) => entry.cssText.startsWith('@property --space-example'))).toHaveLength(1)
})

test('不同 Variable 分支分别匹配，并由浏览器执行嵌套交集', async () => {
  const distance = variable('2px', { name: "browser-distance-size", states: Object.fromEntries([['hover', '4px']]) })
  const factor = variable(2, { name: "browser-distance-ratio", states: Object.fromEntries([['testLarge', 3]]) })
  handles.push(rule('.example', 'margin-left', calcMultiply(distance, factor)))
  root.mount()
  expect(getComputedStyle(element).marginLeft).toBe('4px')
  element.dataset.large = ''
  expect(getComputedStyle(element).marginLeft).toBe('6px')
  await userEvent.hover(element)
  expect(getComputedStyle(element).marginLeft).toBe('12px')
})

test('同址 Variable 分支在浏览器中共同更新复合值', async () => {
  const distance = variable('2px', { name: "browser-shared-size", states: Object.fromEntries([['hover', '4px']]) })
  const factor = variable(2, { name: "browser-shared-ratio", states: Object.fromEntries([['hover', 3]]) })
  handles.push(rule('.example', 'margin-left', calcMultiply(distance, factor)))
  root.mount()
  expect(getComputedStyle(element).marginLeft).toBe('4px')
  await userEvent.hover(element)
  expect(getComputedStyle(element).marginLeft).toBe('12px')
})

test('hover 与 active 同时匹配时，分支书写顺序不改变最终值', async () => {
  const button = document.createElement('button')
  button.className = 'subject-order'
  button.textContent = '条件顺序验证'
  document.body.append(button)
  const handle = rule('.subject-order', 'margin-left', variable('1px', { name: "browser-ordered-size", states: Object.fromEntries([['hover', '2px'], ['active', '3px']]) }))
  handles.push(handle)
  try {
    root.mount()
    const forwardCSS = style.textContent
    await userEvent.hover(button)
    button.focus()
    await userEvent.keyboard('[Space>]')
    try {
      expect(button.matches(':hover:active')).toBe(true)
      expect(getComputedStyle(button).marginLeft).toBe('3px')
      handle.replace(variable('1px', { name: "browser-ordered-size", states: Object.fromEntries([['active', '3px'], ['hover', '2px']]) }))
      root.mount()
      expect(style.textContent).toBe(forwardCSS)
      expect(getComputedStyle(button).marginLeft).toBe('3px')
    } finally { await userEvent.keyboard('[/Space]') }
  } finally { button.remove() }
})

test('Variable 比例在浏览器改变混色结果，消费函数只定义一次', async () => {
  const ratio = variable(0.8, { name: 'surface-ratio', states: { hover: 0.6 } })
  handles.push(rule('.example', 'background-color', colorMix(['black', ratio], 'white')))
  root.mount()
  expect(style.textContent!.match(/background-color:/g)).toHaveLength(1)
  expect(getComputedStyle(element).getPropertyValue('--surface-ratio').trim()).toBe('0.8')
  const initial = getComputedStyle(element).backgroundColor
  expect(initial).not.toBe('rgba(0, 0, 0, 0)')
  await userEvent.hover(element)
  expect(getComputedStyle(element).getPropertyValue('--surface-ratio').trim()).toBe('0.6')
  const hovered = getComputedStyle(element).backgroundColor
  expect(hovered).not.toBe(initial)
  element.style.setProperty('--surface-ratio', '0.2')
  expect(getComputedStyle(element).backgroundColor).not.toBe(hovered)
})

test('动画复合值激活帧定义，并继续解析帧内变量', () => {
  const opacity = variable(undefined, { name: '--final-opacity', root: { value: 0.7 } })
  const frames: Rules = [[[condition('from')], 'opacity', opacity], [[condition('to')], 'opacity', opacity]]
  const name = animationName('motion-appearance', frames)
  handles.push(rule('.example', 'animation', animationValue({ name, duration: '1s', playState: 'paused' })))
  root.mount()
  expect(getComputedStyle(element).animationName).toBe('motion-appearance')
  expect(getComputedStyle(element).opacity).toBe('0.7')
  expect(Array.from(style.sheet!.cssRules).some((entry) => entry.cssText.startsWith('@keyframes motion-appearance'))).toBe(true)
})

test('完整函数定义作为依赖挂载，浏览器执行带媒体条件的函数', () => {
  const body: Rules = [[undefined, 'result', variable('16px', { name: "browser-function-size", states: Object.fromEntries([['testMedia', '20px']]) })]]
  const size = cssFunction('--example-size() returns <length>', body)
  handles.push(rule('.example', 'font-size', size()))
  root.mount()
  expect(getComputedStyle(element).fontSize).toBe('20px')
})

test('源 Rule 删除后重新挂载，派生依赖随可达性退出且既有宿主内容保留', () => {
  const reference = variable(undefined, { name: '--temporary-reference', root: { value: '12px' } })
  const handle = rule('.example', 'margin-left', reference)
  handles.push(handle)
  root.mount()
  expect(getComputedStyle(element).marginLeft).toBe('12px')
  const rules = Array.from(style.sheet!.cssRules)
  root.mount()
  expect(Array.from(style.sheet!.cssRules)).toEqual(rules)
  handle.remove()
  root.mount()
  expect(style.textContent).not.toContain('--temporary-reference')
  expect(style.textContent).toContain('.existing')
})

test('缺少宿主时不触发 Value；编译失败保留之前成功提交的 CSS', () => {
  const active = vi.fn()
  handles.push(rule('.example', 'margin-left', value('2px', { onActive: active })))
  style.remove()
  expect(() => root.mount()).toThrow('缺少样式挂载节点')
  expect(active).not.toHaveBeenCalled()
  document.head.append(style)
  root.mount()
  const before = style.textContent
  const invalid: Rules = []
  invalid.push([undefined, undefined, invalid])
  handles.push(rule('.example', 'color', value('red', { onActive: () => invalid })))
  expect(() => root.mount()).toThrow('递归引用')
  expect(style.textContent).toBe(before)
  expect(getComputedStyle(element).marginLeft).toBe('2px')
})

test('未知 State Condition 使挂载失败并保留上次 CSS 与 CSSOM', () => {
  handles.push(rule('.example', 'margin-left', '12px'))
  root.mount()
  const before = style.textContent
  const beforeRules = Array.from(style.sheet!.cssRules)
  handles.push(rule('.example', 'color', variable('red', { name: "browser-unknown-color", states: Object.fromEntries([['unknown-subject', 'blue']]) })))
  expect(() => root.mount()).toThrow('未知 State Condition')
  expect(style.textContent).toBe(before)
  expect(Array.from(style.sheet!.cssRules)).toEqual(beforeRules)
  expect(getComputedStyle(element).marginLeft).toBe('12px')
})

test('AB 同时激活时两个 Variable 都取 B，参数与分支反序仍为 55', () => {
  const first = variable(1, { name: "browser-first-ratio", states: { browserA: 2, browserB: 5 } })
  const second = variable(1, { name: "browser-second-ratio", states: { browserB: 11, browserA: 7 } })
  const width = rule('.example', 'width', calcMultiply(calcMultiply(first, second), '1px'))
  handles.push(width)
  root.mount()
  expect(getComputedStyle(element).width).toBe('1px')
  element.dataset.a = ''
  expect(getComputedStyle(element).width).toBe('14px')
  element.dataset.b = ''
  expect(getComputedStyle(element).width).toBe('55px')
  width.replace(calcMultiply(calcMultiply(second, first), '1px'))
  root.mount()
  expect(getComputedStyle(element).width).toBe('55px')
})

test('交错条件块不能提前合并，否则会改变简写与详细属性的覆盖', () => {
  handles.push(rule(['.example', '&:where([data-a])'], 'margin', '1px'))
  handles.push(rule('.example', 'margin-left', '10px'))
  handles.push(rule(['.example', '&:where([data-a])'], 'margin-top', '3px'))
  element.dataset.a = ''
  root.mount()
  expect(getComputedStyle(element).marginLeft).toBe('10px')
  expect(getComputedStyle(element).marginTop).toBe('3px')
})

test('原生同名声明不预先覆盖，浏览器忽略无效后值并采用前值', () => {
  handles.push(rules('.example', [[key('margin-left'), '7px'], [key('margin-left'), '不是合法长度']]))
  root.mount()
  expect(getComputedStyle(element).marginLeft).toBe('7px')
})

test('同名函数的完整依赖由后一个定义接管，不残留旧局部变量', () => {
  const oldBody: Rules = [[undefined, '--old', '100px'], [undefined, 'result', 'var(--old)']]
  const nextBody: Rules = [[undefined, 'result', 'var(--old, 24px)']]
  handles.push(rule('.example', 'margin-left', cssFunction('--replace-test() returns <length>', oldBody)()))
  handles.push(rule('.example', 'margin-right', cssFunction('--replace-test() returns <length>', nextBody)()))
  root.mount()
  expect(getComputedStyle(element).marginLeft).toBe('24px')
  expect(getComputedStyle(element).marginRight).toBe('24px')
  expect(style.textContent).not.toContain('--old:')
})
