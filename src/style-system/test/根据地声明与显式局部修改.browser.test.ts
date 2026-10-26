/** 通过实际尺寸验证根据地保障、CSS 继承和显式修改，不固定编译步骤。 */
import { token } from '../token'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { compileRules } from '../css-root'
import { declare } from '../operations/declare'
import { modify } from '../operations/modify'
import { add, multiply } from '../pieces/contents/functions/calc'

afterEach(() => document.body.replaceChildren())

test('根变量的状态只属于根，局部显式10px不会随自己的状态变成8px', () => {
  const size = token('4px', {
    name: 'home-only-root-state',
    state: { '&[data-phase]': '8px' },
  })
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([
      [['.Box'], ...declare(size, '10px')],
      [['.Box'], 'width', size],
      [['.RootConsumer'], 'width', size],
    ])
  const box = document.body.appendChild(document.createElement('div'))
  box.className = 'Box'
  const neighbor = document.body.appendChild(document.createElement('div'))
  neighbor.className = 'RootConsumer'
  box.dataset.phase = ''
  expect.soft(getComputedStyle(box).width).toBe('10px')
  expect.soft(getComputedStyle(neighbor).width).toBe('4px')
  document.documentElement.dataset.phase = ''
  try {
    expect.soft(getComputedStyle(box).width).toBe('10px')
    expect.soft(getComputedStyle(neighbor).width).toBe('8px')
  } finally {
    delete document.documentElement.dataset.phase
  }
})

test.each([':root', ':where(:root)'])(
  '显式根别名%s保留已有基础和状态，undefined不补回默认',
  (root) => {
    const size = token('4px', {
      name: 'home-root-alias-state',
      state: { '&[data-phase]': (base) => multiply(base, 2) },
    })
    const empty = token('9px', 'home-root-alias-empty')
    const css = compileRules([
      [[root], ...declare(size, '6px')],
      [[root], ...declare(empty, undefined)],
      [['.AliasConsumer'], 'width', size],
      [['.AliasConsumer'], 'height', empty],
      [['.AliasConsumer'], 'min-height', 'var(--home-root-alias-empty, 1px)'],
    ])
    document.body.appendChild(document.createElement('style')).textContent = css
    const element = document.body.appendChild(document.createElement('div'))
    element.className = 'AliasConsumer'
    expect(getComputedStyle(element).width).toBe('6px')
    expect(getComputedStyle(element).minHeight).toBe('1px')
    expect(css).not.toContain('--home-root-alias-empty: 9px')
    document.documentElement.dataset.phase = ''
    try {
      expect(getComputedStyle(element).width).toBe('12px')
    } finally {
      delete document.documentElement.dataset.phase
    }
  },
)

test('函数显式复用组件根据地，外部赋值只改变当地值', () => {
  const source = token('4px', {
    name: 'home-copy-source',
    address: '.CopyHome',
    state: { '&[data-phase]': (base) => multiply(base, 2) },
  })
  const copied = token('5px', {
    name: 'home-copy-result',
    address: source.address,
    state: source.state,
  })
  const wide = token(multiply(copied.default, 3), {
    name: 'home-copy-wide',
    address: copied.address,
    state: { '&[data-phase]': (base) => multiply(base, 2) },
  })
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([
      [['.CopyHome, .CopyOutside'], 'width', copied],
      [['.CopyHome, .CopyOutside'], 'height', wide],
      [['.CopyOutside'], ...declare(copied, '7px')],
      [['.CopyOutside'], ...declare(wide, '9px')],
    ])
  const home = document.body.appendChild(document.createElement('div'))
  home.className = 'CopyHome'
  const outside = document.body.appendChild(document.createElement('div'))
  outside.className = 'CopyOutside'
  expect(getComputedStyle(home).width).toBe('5px')
  expect(getComputedStyle(home).height).toBe('15px')
  home.dataset.phase = outside.dataset.phase = ''
  expect(getComputedStyle(home).width).toBe('10px')
  expect(getComputedStyle(home).height).toBe('30px')
  expect(getComputedStyle(outside).width).toBe('7px')
  expect(getComputedStyle(outside).height).toBe('9px')
})

test('指定根据地才取得材料，那里已有新值时保留而不覆盖', () => {
  const size = token('10px', { name: 'home-size', address: '.Home' })
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([
      [['.Elsewhere'], ...declare(size, '30px')],
      [['.Consumer'], 'width', size],
      [['.Outside'], 'width', 'var(--home-size, 1px)'],
    ])
  const home = document.body.appendChild(document.createElement('div'))
  home.className = 'Home'
  const consumer = home.appendChild(document.createElement('div'))
  consumer.className = 'Consumer'
  expect(getComputedStyle(consumer).width).toBe('10px')
  const elsewhere = document.body.appendChild(document.createElement('div'))
  elsewhere.className = 'Elsewhere Consumer'
  expect(getComputedStyle(elsewhere).width).toBe('30px')
  const outside = document.body.appendChild(document.createElement('div'))
  outside.className = 'Outside'
  expect(getComputedStyle(outside).width).toBe('1px')
  document.body.querySelector('style')!.textContent = compileRules([
    [['.Home'], ...declare(size, '20px')],
    [['.Consumer'], 'width', size],
  ])
  expect(getComputedStyle(consumer).width).toBe('20px')
})

test('局部同名输入不搬运祖先公式，根输入变化仍正常计算', () => {
  const base = token('4px', 'home-base')
  const width = token(multiply(base, 2), 'home-width')
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([
      [['.Consumer'], 'width', width],
      [['.Consumer', '&.Local'], ...declare(base, '7px')],
    ])
  const local = document.body.appendChild(document.createElement('div'))
  local.className = 'Consumer Local'
  expect(getComputedStyle(local).width).toBe('8px')
  document.documentElement.style.setProperty('--home-base', '9px')
  try {
    expect(getComputedStyle(local).width).toBe('18px')
  } finally {
    document.documentElement.style.removeProperty('--home-base')
  }
})

test('根声明的CSS优先关系同时决定当前值、状态基础与显式修改', () => {
  const size = token('4px', {
    name: 'home-root-priority',
    state: { '&[data-root-phase]': (base) => multiply(base, 2) },
  })
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([
      [[':root'], '--home-root-priority', '20px'],
      [[':where(:root)'], '--home-root-priority', '30px'],
      [['.RootModified'], 'width', size],
      [['.RootNeighbor'], 'width', size],
      [
        ['.RootModified'],
        ...modify(size, {
          type: 'expression',
          detail: (current) => add(current, '3px'),
        }),
      ],
    ])
  const modified = document.body.appendChild(document.createElement('div'))
  modified.className = 'RootModified'
  const neighbor = document.body.appendChild(document.createElement('div'))
  neighbor.className = 'RootNeighbor'
  expect.soft(getComputedStyle(modified).width).toBe('23px')
  expect.soft(getComputedStyle(neighbor).width).toBe('20px')
  document.documentElement.dataset.rootPhase = ''
  try {
    expect.soft(getComputedStyle(modified).width).toBe('43px')
    expect.soft(getComputedStyle(neighbor).width).toBe('40px')
  } finally {
    delete document.documentElement.dataset.rootPhase
  }
})

test('状态随组件根据地声明，悬停只改变对应实例', async () => {
  const size = token('10px', {
    name: 'home-state-size',
    address: '.HomeButton',
    state: { hover: (current) => multiply(current, 2) },
  })
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([[['.Consumer'], 'width', size]])
  const first = document.body.appendChild(document.createElement('button'))
  first.className = 'HomeButton Consumer'
  const second = document.body.appendChild(document.createElement('button'))
  second.className = 'HomeButton Consumer'
  for (const element of [first, second])
    element.style.cssText = 'padding:0;border:0;height:20px'
  expect(getComputedStyle(first).width).toBe('10px')
  await userEvent.hover(first)
  expect.soft(getComputedStyle(first).width).toBe('20px')
  expect.soft(getComputedStyle(second).width).toBe('10px')
  await userEvent.unhover(first)
  expect(getComputedStyle(first).width).toBe('10px')
})

test('显式修改无需手工基础声明，固定状态的实际结果也被加工', () => {
  const size = token('10px', {
    name: 'home-modified-size',
    address: '.Modified',
    state: { '&[data-phase]': '20px' },
  })
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([
      [['.Modified'], 'width', size],
      [
        ['.Modified'],
        ...modify(size, {
          type: 'expression',
          detail: (current) => add(current, '3px'),
        }),
      ],
    ])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'Modified'
  expect.soft(getComputedStyle(element).width).toBe('13px')
  element.dataset.phase = ''
  expect.soft(getComputedStyle(element).width).toBe('23px')
})
