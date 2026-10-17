/** 来源：用户要求 base 是本次声明基础，extend 保留原始状态规则；浏览器仅检验一次编译的静态 CSS。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { compileRules } from '../css-root'
import { declare } from '../operations/declare'
import { add, multiply } from '../pieces/contents/functions/calc'
import { variable } from '../variable'
import { modify } from '../operations/modify'
import { key, type JSSKey } from '../key'
import type { ValueInput } from '../value'
import * as variables from '../variable'
import { colorMix } from '../pieces/contents/functions/color-mix'

afterEach(() => document.body.replaceChildren())

/**
 * 将本例的一次编译 CSS 与明确选择器元素挂到浏览器，断言仍由各场景直接表达。
 */
function mountCSS(css: string, className: string, tag = 'div'): HTMLElement {
  document.body.appendChild(document.createElement('style')).textContent = css
  const element = document.body.appendChild(document.createElement(tag))
  element.className = className
  return element
}

test.each(['Key', '原始二元'])('只有前置 Name 的来源由 %s 声明，子元素使用当地蓝色派生', entry => {
  const id = entry === 'Key' ? 'key' : 'raw'
  const address = `--browser-name-only-source-${id}`
  const sourceName = variables.variableName(address)
  const line = variable(colorMix([sourceName, 0.18], 'transparent'), { name: `browser-name-only-line-${id}`, priority: 2 })
  const parentDeclaration: [JSSKey, ValueInput] = entry === 'Key' ? declare(key(address), 'red') : [address, 'red']
  const childDeclaration: [JSSKey, ValueInput] = entry === 'Key' ? declare(key(address), 'blue') : [address, 'blue']
  const css = compileRules([
    [['.Parent'], ...parentDeclaration], [['.Parent'], 'color', line],
    [['.Child'], ...childDeclaration], [['.Child'], 'color', `var(--browser-name-only-line-${id})`],
    [['.ExpectedBlue'], 'color', 'color-mix(in oklab, blue 18%, transparent)'],
    [['.ExpectedRed'], 'color', 'color-mix(in oklab, red 18%, transparent)'],
  ])
  const parent = mountCSS(css, 'Parent')
  const child = parent.appendChild(document.createElement('div'))
  child.className = 'Child'
  const blue = document.body.appendChild(document.createElement('div'))
  blue.className = 'ExpectedBlue'
  const red = document.body.appendChild(document.createElement('div'))
  red.className = 'ExpectedRed'
  expect(getComputedStyle(parent).color).toBe(getComputedStyle(red).color)
  expect(getComputedStyle(child).color).toBe(getComputedStyle(blue).color)
  expect(getComputedStyle(child).color).not.toBe(getComputedStyle(parent).color)
})

test.each([false, true])('前置 Name 颜色配方在子作用域跟随来源和状态，引用 Name=%s', useName => {
  const surfaceName = variables.variableName('browser-forward-surface')
  const line = variable(colorMix([surfaceName, 0.18], 'transparent'), {
    name: 'browser-forward-line', priority: 2,
  })
  const surface = variable('red', {
    name: surfaceName,
    states: { '&[data-phase]': 'blue' },
  })
  const css = compileRules([
    [['.Parent'], 'color', useName ? line.name : line],
    [['.Child'], ...declare(surface, 'green')],
    [['.Child'], 'color', 'var(--browser-forward-line)'],
    [['.ExpectedGreen'], 'color', 'color-mix(in oklab, green 18%, transparent)'],
    [['.ExpectedBlue'], 'color', 'color-mix(in oklab, blue 18%, transparent)'],
  ])
  const parent = mountCSS(css, 'Parent')
  const child = parent.appendChild(document.createElement('div'))
  child.className = 'Child'
  const green = document.body.appendChild(document.createElement('div'))
  green.className = 'ExpectedGreen'
  const blue = document.body.appendChild(document.createElement('div'))
  blue.className = 'ExpectedBlue'
  expect(getComputedStyle(child).color).toBe(getComputedStyle(green).color)
  child.dataset.phase = ''
  expect(getComputedStyle(child).color).toBe(getComputedStyle(blue).color)
  delete child.dataset.phase
  expect(getComputedStyle(child).color).toBe(getComputedStyle(green).color)
})

test('普通Key两次声明保留join，生成状态同为999而非借用材料等级', () => {
  const source = variable('10px', { name: 'joined-key-state', states: { '&[data-phase]': base => multiply(base, 2) } })
  const target = key('--joined-key-state', { join: values => values.reduce<ValueInput>((total, item) => add(total, item), '0px') })
  const lower = variable('100px', { name: source.name, priority: 998, states: { '&[data-phase]': '100px' } })
  const css = compileRules([
    [['.Parent'], 'width', source],
    [['.Child'], ...declare(target, '3px')], [['.Child'], ...declare(target, '4px')],
    [['.Child'], ...declare(lower)], [['.Child'], 'width', 'var(--joined-key-state)'],
  ])
  const element = mountCSS(css, 'Child')
  expect(getComputedStyle(element).width).toBe('7px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('14px')
})

test('低等级后写声明不把高等级基础移到零附加权重状态之后', async () => {
  const high = variable('red', { name: 'priority-state-anchor', priority: 6, states: { hover: 'gold' } })
  const low = variable('blue', { name: high.name, priority: 5 })
  const css = compileRules([
    [['.Probe'], ...declare(high)], [['.Probe'], ...declare(low)],
    [['.Probe'], 'color', 'var(--priority-state-anchor)'],
  ])
  const element = mountCSS(css, 'Probe', 'button')
  expect(getComputedStyle(element).color).toBe('rgb(255, 0, 0)')
  await userEvent.hover(element)
  expect(getComputedStyle(element).color).toBe('rgb(255, 215, 0)')
  await userEvent.unhover(element)
  expect(getComputedStyle(element).color).toBe('rgb(255, 0, 0)')
})

test.each([false, true])('局部声明重访后状态和修改共用新基础，同名另一实例保留自身值，引用 Name=%s', useName => {
  const source = variable('10px', { name: 'revisited-state-modify', states: { '&[data-phase]': base => multiply(base, 2) } })
  const other = variable('99px', { name: source.name })
  const initial = declare(source, '5px')
  const css = compileRules([
    [['.Probe'], ...initial],
    [['.Probe'], ...modify(source, { type: 'expression', detail: base => add(base, '1px') })],
    [['.Probe'], 'width', useName ? source.name : source],
    [['.Other'], ...declare(other)], [['.Other'], 'width', `var(${other.toCSSString()})`],
    [[], undefined, { onCompile(_context, controller) {
      let updated = false
      controller.addSettlementCheck(() => {
        if (updated) return false
        updated = true
        const node = controller.search({ key: source.key }).find(node => node.content === initial[1])!
        node.content = declare(source, '7px')[1]
        node.compileRevision++
        return true
      })
    } }],
  ])
  const element = mountCSS(css, 'Probe')
  const sibling = document.body.appendChild(document.createElement('div'))
  sibling.className = 'Other'
  expect(getComputedStyle(element).width).toBe('8px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('15px')
  expect(getComputedStyle(sibling).width).toBe('99px')
})

test.each([false, true])('自动来源状态同样触发已消费依赖，子元素原生引用得到当地14px，引用 Name=%s', useName => {
  const source = variable('5px', { name: 'automatic-state-source', states: { '&[data-phase]': '7px' } })
  const line = variable(multiply(useName ? source.name : source, 2), { name: 'automatic-state-line', priority: 2 })
  const css = compileRules([
    [['.Parent'], 'width', useName ? line.name : line],
    [['.Child'], 'height', useName ? source.name : source], [['.Child'], 'width', 'var(--automatic-state-line)'],
  ])
  const parent = mountCSS(css, 'Parent')
  const child = parent.appendChild(document.createElement('div'))
  child.className = 'Child'
  expect(getComputedStyle(child).width).toBe('10px')
  child.dataset.phase = ''
  expect(getComputedStyle(child).width).toBe('14px')
  delete child.dataset.phase
  expect(getComputedStyle(child).width).toBe('10px')
})

test.each(['Variable', 'Key'])('同名%s declare 后，已消费材料的状态按当地7px基础展开为14px', (entry) => {
  const source = variable('10px', { name: 'shared-state-size', priority: 0,
    states: { '&[data-phase]': base => multiply(base, 2) },
  })
  const local = entry === 'Key' ? key('--shared-state-size') : variable('1px', { name: 'shared-state-size', priority: 1 })
  const css = compileRules([
    [['.Parent'], 'width', source], [['.Child'], ...declare(local, '7px')],
    [['.Child'], 'width', 'var(--shared-state-size)'],
  ])
  const element = mountCSS(css, 'Child')
  expect(getComputedStyle(element).width).toBe('7px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('14px')
  delete element.dataset.phase
  expect(getComputedStyle(element).width).toBe('7px')
})

test('只 declare 也展开自身 states，局部7px基础在状态下得到14px而非创建默认20px', () => {
  const size = variable('10px', {
    name: 'base-local-size', priority: 0,
    states: { '&[data-phase]': base => multiply(base, 2) },
  })
  const css = compileRules([
    [['.Local'], ...declare(size, '7px')],
    // 原生引用不激活 Variable 依赖消费，状态必须由 declare 自己提供。
    [['.Local'], 'width', 'var(--base-local-size)'],
  ])
  const element = mountCSS(css, 'Local')
  expect(getComputedStyle(element).width).toBe('7px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('14px')
  delete element.dataset.phase
  expect(getComputedStyle(element).width).toBe('7px')
  expect(css).not.toContain('--base-local-size: var(--base-local-size);')
})

test('extend-only 继承名称和默认内容，保留原始状态规则', () => {
  const source = variable('10px', {
    name: 'base-inherited-size', priority: 0,
    states: { '&[data-phase]': base => multiply(base, 2) },
  })
  const inherited = variable({ extend: source })
  expect(inherited.name).toBe(source.name)
  const css = compileRules([
    [['.Inherited'], ...declare(inherited)],
    [['.Inherited'], 'width', 'var(--base-inherited-size)'],
  ])
  const element = mountCSS(css, 'Inherited')
  expect(getComputedStyle(element).width).toBe('10px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('20px')
})

test('extend的新默认20px重绑继承规则，覆盖一个状态仍保留另一个，局部declare再次重绑', () => {
  const source = variable('10px', {
    name: 'base-original-size', priority: 0,
    states: {
      '&[data-phase]': base => multiply(base, 2),
      '&[data-other]': base => multiply(base, 3),
    },
  })
  const larger = variable('20px', {
    extend: source,
    states: { '&[data-other]': '50px' },
  })
  const css = compileRules([
    [['.Larger'], ...declare(larger)],
    [['.Larger'], 'width', larger],
    [['.LocalLarger'], ...declare(larger, '7px')],
    [['.LocalLarger'], 'width', `var(${larger.toCSSString()})`],
    [['.Source'], 'width', source],
  ])
  const inherited = mountCSS(css, 'Larger')
  const local = document.body.appendChild(document.createElement('div'))
  local.className = 'LocalLarger'
  expect(getComputedStyle(inherited).width).toBe('20px')
  expect(getComputedStyle(local).width).toBe('7px')
  inherited.dataset.phase = ''
  local.dataset.phase = ''
  expect(getComputedStyle(inherited).width).toBe('40px')
  expect(getComputedStyle(local).width).toBe('14px')
  inherited.dataset.other = ''
  expect(getComputedStyle(inherited).width).toBe('50px')
  delete inherited.dataset.other
  expect(getComputedStyle(inherited).width).toBe('40px')
})
