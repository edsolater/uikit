/** 验证共享分类条件跨主体复用，以及局部条件和交互标记的实际 CSS 效果。 */
import { afterEach, expect, test } from 'vitest'
import { stateCondition } from '../../state-condition'
import { compileCSS } from '../../css-root'
import { rules, type RulesHandle } from '../../rule'
import { token } from '../../token'
import { baseRadius } from '../tokens/radius'
import { baseOpacity } from '../tokens/opacity'
import {
  whenFilled,
  whenOutlined,
  whenPlain,
  whenToned,
  whenDanger,
  whenSoft,
  whenStrong,
  whenSmall,
  whenLarge,
  whenXlarge,
} from './profile'
import { whenLoading, whenEnabled } from './interaction'

const handles: RulesHandle[] = []

test('材料复用尺寸与强调条件后保留实际倍率，并在退出状态时恢复基础', () => {
  const address = '.ProfileMaterials'
  handles.push(
    rules(address, {
      'border-radius': token(baseRadius, {
        address,
        state: baseRadius.state,
      }),
      'opacity': token(baseOpacity, {
        address,
        state: baseOpacity.state,
      }),
    }),
  )
  document.body.appendChild(document.createElement('style')).textContent =
    compileCSS()
  const button = document.body.appendChild(document.createElement('button'))
  button.className = 'ProfileMaterials'
  expect(getComputedStyle(button).borderTopLeftRadius).toBe('4px')
  expect(getComputedStyle(button).opacity).toBe('1')
  for (const [size, radius] of [
    ['small', '2px'],
    ['large', '8px'],
    ['xlarge', '12px'],
  ]) {
    button.dataset.size = size
    expect(getComputedStyle(button).borderTopLeftRadius).toBe(radius)
  }
  button.dataset.emphasis = 'soft'
  expect(getComputedStyle(button).opacity).toBe('0.72')
  delete button.dataset.emphasis
  button.disabled = true
  expect(getComputedStyle(button).opacity).toBe('0.48')
  delete button.dataset.size
  button.disabled = false
  expect(getComputedStyle(button).borderTopLeftRadius).toBe('4px')
  expect(getComputedStyle(button).opacity).toBe('1')
})

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
  document.body.replaceChildren()
})

test.each([
  ['填充', whenFilled, 'data-appearance', 'filled', 'filled-extra'],
  ['轮廓', whenOutlined, 'data-appearance', 'outlined', 'filled'],
  ['轻量', whenPlain, 'data-appearance', 'plain', 'outlined'],
  ['有语气', whenToned, 'data-tone', 'info', undefined],
  ['危险', whenDanger, 'data-tone', 'danger', 'dangerous'],
  ['柔和', whenSoft, 'data-emphasis', 'soft', 'strong'],
  ['强调', whenStrong, 'data-emphasis', 'strong', 'soft'],
  ['小尺寸', whenSmall, 'data-size', 'small', 'large'],
  ['大尺寸', whenLarge, 'data-size', 'large', 'xlarge'],
  ['超大尺寸', whenXlarge, 'data-size', 'xlarge', 'large'],
] as const)(
  '%s 条件在不同主体中同时支持 state 和规则地址',
  (_, profile, attribute, matching, other) => {
    const distance = token('10px', {
      address: '.ProfileSubject',
      state: [[profile, '12px']],
    })
    handles.push(
      rules('.ProfileSubject', {
        'padding-left': distance,
        'padding-right': '4px',
      }),
      rules(['.ProfileSubject', profile], { 'padding-right': '8px' }),
    )
    const style = document.body.appendChild(document.createElement('style'))
    style.textContent = compileCSS()
    const action = document.body.appendChild(document.createElement('button'))
    const panel = document.body.appendChild(document.createElement('div'))
    action.className = 'ProfileSubject ProfileAction'
    panel.className = 'ProfileSubject ProfilePanel'
    for (const element of [action, panel]) {
      expect(getComputedStyle(element).paddingLeft).toBe('10px')
      expect(getComputedStyle(element).paddingRight).toBe('4px')
      element.setAttribute(attribute, matching)
      expect(getComputedStyle(element).paddingLeft).toBe('12px')
      expect(getComputedStyle(element).paddingRight).toBe('8px')
      if (other === undefined) element.removeAttribute(attribute)
      else element.setAttribute(attribute, other)
      expect(getComputedStyle(element).paddingLeft).toBe('10px')
      expect(getComputedStyle(element).paddingRight).toBe('4px')
    }
  },
)

test('loading 只匹配状态集合成员，enabled 同时排除原生和标记禁用', () => {
  handles.push(
    rules('.ProfileStatus', { 'padding-left': '4px', 'padding-right': '4px' }),
    rules(['.ProfileStatus', whenLoading], { 'padding-left': '12px' }),
    rules(['.ProfileStatus', whenEnabled], { 'padding-right': '8px' }),
  )
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileCSS()
  const action = document.body.appendChild(document.createElement('button'))
  const panel = document.body.appendChild(document.createElement('div'))
  for (const element of [action, panel]) {
    element.className = 'ProfileStatus'
    for (const [status, expected] of [
      ['', '4px'],
      ['loading', '12px'],
      ['busy loading', '12px'],
      ['preloading loading-extra', '4px'],
    ]) {
      element.dataset.status = status
      expect(getComputedStyle(element).paddingLeft).toBe(expected)
      expect(getComputedStyle(element).paddingRight).toBe('8px')
    }
    element.dataset.status = 'busy disabled'
    expect(getComputedStyle(element).paddingRight).toBe('4px')
    element.dataset.status = 'not-disabled'
    expect(getComputedStyle(element).paddingRight).toBe('8px')
  }
  action.disabled = true
  expect(getComputedStyle(action).paddingRight).toBe('4px')
  expect(getComputedStyle(panel).paddingRight).toBe('8px')
  action.disabled = false
  expect(getComputedStyle(action).paddingRight).toBe('8px')
})

test('局部 StateCondition 无需注册，独立条件不改写共享分类的含义', () => {
  const open = stateCondition('&[data-local="open"]')
  const closed = stateCondition('&[data-local="closed"]')
  const distance = token('10px', {
    address: '.LocalProfile',
    state: [
      [open, '12px'],
      [closed, '14px'],
    ],
  })
  handles.push(
    rules('.LocalProfile', {
      'padding-left': distance,
      'padding-right': '4px',
    }),
    rules(['.LocalProfile', whenFilled], { 'padding-right': '8px' }),
  )
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileCSS()
  const first = document.body.appendChild(document.createElement('button'))
  const second = document.body.appendChild(document.createElement('div'))
  first.className = second.className = 'LocalProfile'
  first.dataset.local = 'open'
  second.dataset.local = 'closed'
  expect(getComputedStyle(first).paddingLeft).toBe('12px')
  expect(getComputedStyle(second).paddingLeft).toBe('14px')
  first.dataset.appearance = 'filled'
  expect(getComputedStyle(first).paddingRight).toBe('8px')
  expect(getComputedStyle(second).paddingRight).toBe('4px')
  first.dataset.local = 'closed'
  expect(getComputedStyle(first).paddingLeft).toBe('14px')
  expect(getComputedStyle(first).paddingRight).toBe('8px')
  expect(getComputedStyle(second).paddingLeft).toBe('14px')
  delete second.dataset.local
  expect(getComputedStyle(second).paddingLeft).toBe('10px')
  expect(getComputedStyle(first).paddingLeft).toBe('14px')
})
