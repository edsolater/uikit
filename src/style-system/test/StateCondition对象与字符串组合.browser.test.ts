/** 验证状态对象与字符串的统一消费、独立状态叠加和局部条件独立性。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { compileCSS } from '../css-root'
import { rules, type RulesHandle } from '../rule'
import { token } from '../token'
import { stateCondition } from '../state-condition'
import { whenDanger } from '../pieces/conditions/profile'
import {
  whenHover,
  whenEnabled,
  whenDisabled,
} from '../pieces/conditions/interaction'

const handles: RulesHandle[] = []

test('配置覆盖同义条件只替换值，不移动直接条件的原有顺序', () => {
  const first = stateCondition('&[data-first]')
  const width = token(
    { default: '4px' },
    {
      address: '.OverrideOrder',
      state: [
        [stateCondition('&[data-first]'), '8px'],
        [stateCondition('&[data-second]'), '12px'],
        [first, '16px'],
      ],
    },
  )
  handles.push(rules('.OverrideOrder', { 'padding-left': width }))
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileCSS()
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'OverrideOrder'
  element.dataset.first = element.dataset.second = ''
  expect(getComputedStyle(element).paddingLeft).toBe('12px')
  delete element.dataset.second
  expect(getComputedStyle(element).paddingLeft).toBe('16px')
  delete element.dataset.first
  expect(getComputedStyle(element).paddingLeft).toBe('4px')
})

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
  document.body.replaceChildren()
})

test('对象与字符串 hover 等价，disabled 与 enabled 各自控制自己的属性', async () => {
  const fromString = token('4px', {
    address: '.EquivalentState',
    state: { hover: '8px' },
  })
  const fromObject = token('4px', {
    address: '.EquivalentState',
    state: new Map([[whenHover, '8px']]),
  })
  const availability = token('4px', {
    address: '.EquivalentState',
    state: [[whenEnabled, '12px']],
  })
  const opacity = token(1, {
    address: '.EquivalentState',
    state: [[whenDisabled, 0.5]],
  })
  handles.push(
    rules('.EquivalentState', {
      'padding-left': fromString,
      'padding-right': fromObject,
      'min-width': availability,
      opacity,
    }),
  )
  document.body.appendChild(document.createElement('style')).textContent =
    compileCSS()
  const button = document.body.appendChild(document.createElement('button'))
  button.className = 'EquivalentState'
  expect(getComputedStyle(button).paddingLeft).toBe('4px')
  expect(getComputedStyle(button).minWidth).toBe('12px')
  await userEvent.hover(button)
  expect(getComputedStyle(button).paddingLeft).toBe('8px')
  expect(getComputedStyle(button).paddingRight).toBe('8px')
  for (const mode of ['native', 'status']) {
    button.disabled = mode === 'native'
    if (mode === 'status') button.dataset.status = 'disabled'
    expect(getComputedStyle(button).paddingLeft).toBe('8px')
    expect(getComputedStyle(button).paddingRight).toBe('8px')
    expect(getComputedStyle(button).opacity).toBe('0.5')
    expect(getComputedStyle(button).minWidth).toBe('4px')
  }
  await userEvent.unhover(button)
  expect(getComputedStyle(button).paddingLeft).toBe('4px')
  expect(getComputedStyle(button).opacity).toBe('0.5')
  delete button.dataset.status
  expect(getComputedStyle(button).opacity).toBe('1')
  expect(getComputedStyle(button).minWidth).toBe('12px')
})

test('独立局部条件可用于 Token 与规则地址，取消一个不影响另一个', async () => {
  const selected = stateCondition('&[data-selected]')
  const distance = token('4px', {
    address: '.IndependentSubject',
    state: [[whenHover, '12px']],
  })
  handles.push(
    rules('.IndependentSubject', {
      'padding-left': distance,
      'padding-right': '4px',
    }),
    rules(['.IndependentSubject', selected], { 'padding-right': '10px' }),
  )
  document.body.appendChild(document.createElement('style')).textContent =
    compileCSS()
  const button = document.body.appendChild(document.createElement('button'))
  button.className = 'IndependentSubject'
  button.dataset.selected = ''
  expect(getComputedStyle(button).paddingLeft).toBe('4px')
  expect(getComputedStyle(button).paddingRight).toBe('10px')
  await userEvent.hover(button)
  expect(getComputedStyle(button).paddingLeft).toBe('12px')
  expect(getComputedStyle(button).paddingRight).toBe('10px')
  delete button.dataset.selected
  expect(getComputedStyle(button).paddingLeft).toBe('12px')
  expect(getComputedStyle(button).paddingRight).toBe('4px')
  await userEvent.unhover(button)
  expect(getComputedStyle(button).paddingLeft).toBe('4px')
})

test('已登记快捷名与对象按各自定义顺序参与 CSS 层叠', () => {
  const fromObject = token('4px', {
    address: '.OrderedState',
    state: [
      [whenDanger, '24px'],
      ['toned', '12px'],
    ],
  })
  const fromString = token('4px', {
    address: '.OrderedState',
    state: { toned: '12px', danger: '24px' },
  })
  handles.push(
    rules('.OrderedState', {
      'padding-left': fromObject,
      'padding-right': fromString,
    }),
  )
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileCSS()
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'OrderedState'
  element.dataset.tone = 'danger'
  expect(getComputedStyle(element).paddingLeft).toBe('12px')
  expect(getComputedStyle(element).paddingRight).toBe('24px')
  element.dataset.tone = 'info'
  expect(getComputedStyle(element).paddingLeft).toBe('12px')
  expect(getComputedStyle(element).paddingRight).toBe('12px')
  delete element.dataset.tone
  expect(getComputedStyle(element).paddingLeft).toBe('4px')
  expect(getComputedStyle(element).paddingRight).toBe('4px')
})

test('focus 与 focusVisible 对应同一条件，后写配置覆盖前写配置', async () => {
  const reverse = token('4px', {
    address: '.FocusAliasOrder',
    state: { focusVisible: '30px', focus: '20px' },
  })
  const forward = token('4px', {
    address: '.FocusAliasOrder',
    state: { focus: '20px', focusVisible: '30px' },
  })
  handles.push(
    rules('.FocusAliasOrder', {
      'padding-left': reverse,
      'padding-right': forward,
    }),
  )
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileCSS()
  const button = document.body.appendChild(document.createElement('button'))
  button.className = 'FocusAliasOrder'
  expect(getComputedStyle(button).paddingLeft).toBe('4px')
  expect(getComputedStyle(button).paddingRight).toBe('4px')
  await userEvent.tab()
  expect(button.matches(':focus-visible')).toBe(true)
  expect(getComputedStyle(button).paddingLeft).toBe('20px')
  expect(getComputedStyle(button).paddingRight).toBe('30px')
  button.blur()
  expect(getComputedStyle(button).paddingLeft).toBe('4px')
  expect(getComputedStyle(button).paddingRight).toBe('4px')
})

test('同头局部对象不争抢全局名称，撤销再消费后各自定义和状态仍独立', () => {
  const firstCondition = stateCondition('&[data-local]')
  const secondCondition = stateCondition('&[data-local]')
  const first = token('4px', {
    address: '.FirstLocalState',
    state: [[firstCondition, '8px']],
  })
  const second = token('6px', {
    address: '.SecondLocalState',
    state: [[secondCondition, '12px']],
  })
  const firstConsumption = rules('.FirstLocalState', { 'padding-left': first })
  const secondConsumption = rules('.SecondLocalState', {
    'padding-left': second,
  })
  handles.push(firstConsumption, secondConsumption)
  const style = document.body.appendChild(document.createElement('style'))
  const firstElement = document.body.appendChild(document.createElement('div'))
  const secondElement = document.body.appendChild(document.createElement('div'))
  firstElement.className = 'FirstLocalState'
  secondElement.className = 'SecondLocalState'
  firstElement.dataset.local = secondElement.dataset.local = ''
  style.textContent = compileCSS()
  expect(getComputedStyle(firstElement).paddingLeft).toBe('8px')
  expect(getComputedStyle(secondElement).paddingLeft).toBe('12px')
  firstConsumption.remove()
  style.textContent = compileCSS()
  expect(getComputedStyle(firstElement).paddingLeft).toBe('0px')
  expect(getComputedStyle(secondElement).paddingLeft).toBe('12px')
  const repeated = rules('.FirstLocalState', { 'padding-left': first })
  handles.push(repeated)
  style.textContent = compileCSS()
  expect(getComputedStyle(firstElement).paddingLeft).toBe('8px')
  delete firstElement.dataset.local
  expect(getComputedStyle(firstElement).paddingLeft).toBe('4px')
  expect(getComputedStyle(secondElement).paddingLeft).toBe('12px')
  repeated.remove()
  secondConsumption.remove()
  style.textContent = compileCSS()
  expect(style.sheet!.cssRules).toHaveLength(0)
})
