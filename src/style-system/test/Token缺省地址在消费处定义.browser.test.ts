/** 无地址 Token 随实际消费位置定义，显式地址保持固定。 */
import { afterEach, expect, test, vi } from 'vitest'
import { compileCSS, compileRules } from '../css-root'
import { token } from '../token'
import { stateCondition } from '../state-condition'
import { add, multiply } from '../pieces/functions/calc'
import { modify } from '../operations/modify'
import { rules } from '../rule'

const phase = stateCondition('&[data-phase]')
afterEach(() => document.body.replaceChildren())

function element(className: string) {
  const node = document.body.appendChild(document.createElement('div'))
  node.className = className
  return node
}

test('同一对象在两地读取当地材料与状态，反向重编译不锁定首次地址', () => {
  const input = token('1px', { name: 'local-home-input' })
  const onFirstScan = vi.fn()
  const onCompile = vi.fn()
  const size = token(multiply(input, 2), {
    name: 'local-home-size',
    state: [[phase, (base) => multiply(base, 2)]],
    onFirstScan,
    onCompile,
  })
  const style = document.body.appendChild(document.createElement('style'))
  const a = element('LocalA')
  const b = element('LocalB')
  a.style.setProperty('--local-home-input', '3px')
  b.style.setProperty('--local-home-input', '7px')
  const entries: import('../rule').Rules = [
    [['.LocalA'], 'padding-left', size],
    [['.LocalB'], 'padding-left', size],
  ]
  for (const current of [entries, [...entries].reverse()]) {
    style.textContent = compileRules(current)
    expect(getComputedStyle(a).paddingLeft).toBe('6px')
    expect(getComputedStyle(b).paddingLeft).toBe('14px')
    a.dataset.phase = ''
    expect(getComputedStyle(a).paddingLeft).toBe('12px')
    expect(getComputedStyle(b).paddingLeft).toBe('14px')
    delete a.dataset.phase
    b.dataset.phase = ''
    expect(getComputedStyle(a).paddingLeft).toBe('6px')
    expect(getComputedStyle(b).paddingLeft).toBe('28px')
    delete b.dataset.phase
    expect(size.address).toBeUndefined()
    expect(input.address).toBeUndefined()
  }
  expect(onFirstScan).toHaveBeenCalledTimes(2)
  expect(onCompile).toHaveBeenCalledTimes(2)
})

test('显式根与组件地址不跟随消费者移动，普通长度仍直接输出', () => {
  const root = token('8px', {
    name: 'explicit-root-home',
    address: ':where(:root)',
  })
  const fixed = token('12px', {
    name: 'explicit-fixed-home',
    address: '.FixedHome',
  })
  const plain = token('2px')
  const css = compileRules([
    [['.Consumer'], 'padding-left', root],
    [['.Consumer'], 'padding-right', fixed],
    [['.Consumer'], 'height', plain],
    [['.Consumer'], 'min-width', 'var(--explicit-fixed-home, 1px)'],
  ])
  document.body.appendChild(document.createElement('style')).textContent = css
  const home = element('FixedHome')
  const inside = home.appendChild(document.createElement('div'))
  inside.className = 'Consumer'
  const outside = element('Consumer')
  expect(getComputedStyle(inside).paddingLeft).toBe('8px')
  expect(getComputedStyle(outside).paddingLeft).toBe('8px')
  expect(getComputedStyle(inside).paddingRight).toBe('12px')
  expect(getComputedStyle(outside).paddingRight).toBe('0px')
  expect(getComputedStyle(inside).minWidth).toBe('12px')
  expect(getComputedStyle(outside).minWidth).toBe('1px')
  expect(getComputedStyle(outside).height).toBe('2px')
  expect(css.match(/--explicit-root-home: 8px/g)).toHaveLength(1)
  expect(css).toContain('height: 2px;')
  expect(plain.name).toBeUndefined()
})

test('撤销一处消费与局部修改后，另一处的基础和状态仍独立生效', () => {
  const size = token('10px', {
    name: 'withdraw-local-home',
    state: [[phase, (base) => multiply(base, 2)]],
  })
  const aRules = rules('.WithdrawA', [
    { 'padding-left': size },
    modify(size, {
      type: 'expression',
      detail: (current) => add(current, '3px'),
    }),
  ])
  const bRules = rules('.WithdrawB', { 'padding-left': size })
  const style = document.body.appendChild(document.createElement('style'))
  const a = element('WithdrawA')
  const b = element('WithdrawB')
  try {
    style.textContent = compileCSS()
    expect(getComputedStyle(a).paddingLeft).toBe('13px')
    expect(getComputedStyle(b).paddingLeft).toBe('10px')
    a.dataset.phase = ''
    expect(getComputedStyle(a).paddingLeft).toBe('23px')
    expect(getComputedStyle(b).paddingLeft).toBe('10px')
    b.dataset.phase = ''
    expect(getComputedStyle(b).paddingLeft).toBe('20px')
    aRules.remove()
    style.textContent = compileCSS()
    expect(getComputedStyle(a).paddingLeft).toBe('0px')
    expect(getComputedStyle(b).paddingLeft).toBe('20px')
    delete b.dataset.phase
    expect(getComputedStyle(b).paddingLeft).toBe('10px')
    expect(style.textContent).not.toContain('.WithdrawA')
  } finally {
    aRules.remove()
    bRules.remove()
  }
})
