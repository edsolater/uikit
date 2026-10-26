/** 根据地状态使用该处基础；通过浏览器验证显式赋值与层叠。 */
import { token, type TokenInput } from '../token'

import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { compileRules } from '../css-root'
import { declare } from '../operations/declare'
import { add, multiply } from '../pieces/contents/functions/calc'

import { key } from '../key'
import { condition } from '../condition'

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

test('普通 Key 两次声明保留 join，状态不移到局部', () => {
  const source = token('10px', {
    name: 'joined-key-state',
    state: { '&[data-phase]': (base) => multiply(base, 2) },
  })
  const target = key('--joined-key-state', {
    join: (values) =>
      values.reduce<TokenInput>((total, item) => add(total, item), '0px'),
  })
  const css = compileRules([
    [['.Parent'], 'width', source],
    [['.Child'], ...declare(target, '3px')],
    [['.Child'], ...declare(target, '4px')],
    [['.Child'], 'width', 'var(--joined-key-state)'],
  ])
  const element = mountCSS(css, 'Child')
  expect(getComputedStyle(element).width).toBe('7px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('7px')
})

test.each(['Token', 'Key'])(
  '同名%s declare 后，不借用另一对象状态，保持当地7px',
  (entry) => {
    const source = token('10px', {
      name: 'shared-state-size',
      state: { '&[data-phase]': (base) => multiply(base, 2) },
    })
    const local =
      entry === 'Key'
        ? key('--shared-state-size')
        : token('1px', { name: 'shared-state-size' })
    const css = compileRules([
      [['.Parent'], 'width', source],
      [['.Child'], ...declare(local, '7px')],
      [['.Child'], 'width', 'var(--shared-state-size)'],
    ])
    const element = mountCSS(css, 'Child')
    expect(getComputedStyle(element).width).toBe('7px')
    element.dataset.phase = ''
    expect(getComputedStyle(element).width).toBe('7px')
    delete element.dataset.phase
    expect(getComputedStyle(element).width).toBe('7px')
  },
)

test('根据地只 declare 也展开自身states，显式7px基础在状态下得到14px', () => {
  const size = token('10px', {
    name: 'base-local-size',
    address: '.Local',
    state: { '&[data-phase]': (base) => multiply(base, 2) },
  })
  const css = compileRules([
    [['.Local'], ...declare(size, '7px')],
    // 原生引用不激活 Token 依赖消费，状态必须由 declare 自己提供。
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
