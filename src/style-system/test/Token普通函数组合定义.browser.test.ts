/** 浏览器确认普通定义组合、CSS 当前值和状态根据地。 */
import { stateCondition } from '../state-condition'
import { afterEach, expect, test } from 'vitest'
import { token, type Token, type TokenInput } from '../token'
import { compileRules } from '../css-root'
import { declare } from '../operations/declare'
import { modify } from '../operations/modify'
import { add, multiply } from '../pieces/functions/calc'

afterEach(() => document.body.replaceChildren())

test('换基础与逐项加工是不同函数行为，来源保持原结果', () => {
  const source = token('10px', {
    name: 'ordinary-source',
    address: '.Home',
    state: [
      [stateCondition('&[data-hover]'), (base) => add(base, '3px')],
      [stateCondition('&[data-active]'), '12px'],
    ],
  })
  const replaceBase = () =>
    token('5px', {
      name: 'ordinary-new-base',
      address: source.address,
      state: source.state,
    })
  const half = (input: Token<TokenInput>) =>
    token(multiply(input.default, 0.5), {
      name: 'ordinary-half',
      address: input.address,
      state: new Map(
        Array.from(input.state ?? []).map(([name, rule]) => [
          name,
          multiply(
            typeof rule === 'function' ? rule(input.default) : rule,
            0.5,
          ),
        ]),
      ),
    })
  const replaced = replaceBase(),
    halved = half(source)
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([
      [['.Home'], 'width', source],
      [['.Home'], 'height', replaced],
      [['.Home'], 'margin-left', halved],
    ])
  const home = document.body.appendChild(document.createElement('div'))
  home.className = 'Home'
  const values = () => {
    const css = getComputedStyle(home)
    return [css.width, css.height, css.marginLeft]
  }
  expect(values()).toEqual(['10px', '5px', '5px'])
  home.dataset.hover = ''
  expect(values()).toEqual(['13px', '8px', '6.5px'])
  home.dataset.active = ''
  expect(values()).toEqual(['12px', '12px', '6px'])
})

test('值表达式读取来源当前 CSS 值，后代覆盖不重算祖先公式', () => {
  const source = token('10px', { name: 'current-source', address: '.Home' })
  const half = (base: Token<TokenInput>) =>
    token(multiply(base, 0.5), { name: 'current-half', address: base.address })
  const result = half(source)
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([
      [['.Consumer'], 'width', result],
      [['.Child'], ...declare(source, '30px')],
    ])
  const home = document.body.appendChild(document.createElement('div'))
  home.className = 'Home Consumer'
  const child = home.appendChild(document.createElement('div'))
  child.className = 'Child Consumer'
  expect(getComputedStyle(home).width).toBe('5px')
  expect(getComputedStyle(child).width).toBe('5px')
  home.style.setProperty('--current-source', '20px')
  expect(getComputedStyle(home).width).toBe('10px')
  expect(getComputedStyle(child).width).toBe('10px')
})

test('函数显式复用注册，不继承时子元素采用注册初值而非 default', () => {
  const source = token('10px', {
    name: 'registration-source',
    address: '.RegisteredHome',
    registration: { syntax: '<length>', inherits: false, initialValue: '2px' },
  })
  const createCopy = () =>
    token(source.default, {
      name: 'registration-copy',
      address: source.address,
      registration: source.registration,
    })
  const copied = createCopy()
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([[['.Consumer'], 'width', copied]])
  const home = document.body.appendChild(document.createElement('div'))
  home.className = 'RegisteredHome Consumer'
  const child = home.appendChild(document.createElement('div'))
  child.className = 'Consumer'
  expect(getComputedStyle(home).width).toBe('10px')
  expect(getComputedStyle(child).width).toBe('2px')
})

test('两个同名定义分别按自己的地址与状态发布，不从消费位置搬运状态', () => {
  const first = token('3px', {
    name: 'shared-address-name',
    address: '.First',
    state: [[stateCondition('&[data-change]'), '5px']],
  })
  const second = token('7px', {
    name: 'shared-address-name',
    address: '.Second',
    state: [[stateCondition('&[data-change]'), '11px']],
  })
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([
      [['.First'], 'width', first],
      [['.Second'], 'width', second],
    ])
  const a = document.body.appendChild(document.createElement('div'))
  a.className = 'First'
  const b = document.body.appendChild(document.createElement('div'))
  b.className = 'Second'
  expect(getComputedStyle(a).width).toBe('3px')
  expect(getComputedStyle(b).width).toBe('7px')
  a.dataset.change = ''
  expect(getComputedStyle(a).width).toBe('5px')
  expect(getComputedStyle(b).width).toBe('7px')
})
