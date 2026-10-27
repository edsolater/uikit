import { stateCondition } from '../state-condition'
/** 验证 Token 自身定义、属性自动消费与条件变化，不依赖外部重复赋值。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { compileCSS } from '../css-root'
import { rules, type RulesHandle } from '../rule'
import { token } from '../token'
import { $height } from '../key-registry'
import { declare } from '../operations/declare'
import {
  whenHover,
  whenActive,
  whenDisabled,
} from '../pieces/conditions/interaction'

const handles: RulesHandle[] = []

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
  document.body.replaceChildren()
})

test('匿名 Token 的地址与状态自动供多个属性消费，最后消费退出后释放定义', () => {
  const dimension = token(
    { default: '12px' },
    {
      address: '.OwnDefinition',
      state: [[stateCondition('&[data-grown]'), '24px']],
    },
  )
  const width = rules('.OwnDefinition', {
    'width': dimension,
    'padding-left': token('2px'),
  })
  const height = rules('.OwnDefinition', [$height, dimension])
  handles.push(width, height)
  const style = document.body.appendChild(document.createElement('style'))
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'OwnDefinition'
  style.textContent = compileCSS()
  expect(getComputedStyle(element).width).toBe('12px')
  expect(getComputedStyle(element).height).toBe('12px')
  expect(getComputedStyle(element).paddingLeft).toBe('2px')
  element.dataset.grown = ''
  expect(getComputedStyle(element).width).toBe('24px')
  expect(getComputedStyle(element).height).toBe('24px')
  width.remove()
  style.textContent = compileCSS()
  expect(getComputedStyle(element).height).toBe('24px')
  expect(getComputedStyle(element).paddingLeft).toBe('0px')
  height.remove()
  style.textContent = compileCSS()
  expect(style.sheet!.cssRules).toHaveLength(0)
  expect(getComputedStyle(element).height).toBe('0px')
})

test('分类和交互都由自身 state 表达，新 Token 只改变明确接入的属性', async () => {
  const filled = stateCondition('&[data-appearance="filled"]')
  const base = token(
    token('10px', { address: '.StateOwner', state: [[filled, '20px']] }),
    {
      address: '.StateOwner',
      state: [
        [whenHover, '12px'],
        [whenActive, '14px'],
        [whenDisabled, '8px'],
      ],
    },
  )
  const local = token('30px', {
    address: '.StateOwner.Local',
    state: { hover: '32px', active: '34px', disabled: '28px' },
  })
  handles.push(rules('.StateOwner', { 'padding-left': base }))
  handles.push(rules('.StateOwner.Local', { 'padding-left': local }))
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileCSS()
  const ordinary = document.body.appendChild(document.createElement('button'))
  ordinary.className = 'StateOwner'
  const classified = document.body.appendChild(document.createElement('button'))
  classified.className = 'StateOwner'
  classified.dataset.appearance = 'filled'
  const own = document.body.appendChild(document.createElement('button'))
  own.className = 'StateOwner Local'
  const padding = (element: HTMLElement) =>
    getComputedStyle(element).paddingLeft
  for (const [element, values] of [
    [ordinary, ['10px', '12px', '14px', '8px']],
    [classified, ['20px', '12px', '14px', '8px']],
    [own, ['30px', '32px', '34px', '28px']],
  ] as const) {
    expect(padding(element)).toBe(values[0])
    await userEvent.hover(element)
    expect(padding(element)).toBe(values[1])
    element.focus()
    await userEvent.keyboard('[Space>]')
    try {
      expect(element.matches(':hover:active')).toBe(true)
      expect(padding(element)).toBe(values[2])
    } finally {
      await userEvent.keyboard('[/Space]')
    }
    await userEvent.unhover(element)
    element.blur()
    expect(padding(element)).toBe(values[0])
    element.disabled = true
    await userEvent.hover(element)
    expect(padding(element)).toBe(values[3])
    await userEvent.unhover(element)
  }
  own.disabled = false
  expect(padding(own)).toBe('30px')
  expect(padding(ordinary)).toBe('8px')
  expect(padding(classified)).toBe('8px')
})

test('危险操作保留兼容：手动 declare 仍能赋值，但不是自动定义的必要前置步骤', () => {
  const dimension = token('10px', { address: '.ManualOverride' })
  const consumption = rules('.ManualOverride', { 'padding-left': dimension })
  handles.push(consumption)
  const style = document.body.appendChild(document.createElement('style'))
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'ManualOverride'
  style.textContent = compileCSS()
  expect(getComputedStyle(element).paddingLeft).toBe('10px')
  const manual = rules('.ManualOverride', declare(dimension, '20px'))
  handles.push(manual)
  style.textContent = compileCSS()
  expect(getComputedStyle(element).paddingLeft).toBe('20px')
  manual.remove()
  style.textContent = compileCSS()
  expect(getComputedStyle(element).paddingLeft).toBe('10px')
})
