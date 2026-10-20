/** 修改材料替换后采用当前规则，退出时恢复基础，不沿用旧结果或重复累计。 */
import { afterEach, expect, test } from 'vitest'
import { compileRules } from '../css-root'
import { add, multiply } from '../pieces/contents/functions/calc'
import { modify } from '../operations/modify'
import { variable } from '../variable'
import { value, type ValueInput } from '../value'
import type { Rules } from '../rule'
import { whenSettled } from './when-settled'

afterEach(() => document.body.replaceChildren())

function mount(css: string, className: string) {
  document.body.appendChild(document.createElement('style')).textContent = css
  const element = document.body.appendChild(document.createElement('div'))
  element.className = className
  return element
}

test.each(['替换材料', '显式失效'])('%s后，默认、固定状态和变体共同更新，旧配方资源退出', update => {
  const size = variable('10px', { name: 'replace-modification-size', address: '.ReplacementBox', states: { '&[data-phase]': '20px' }, variants: { compact: '4px' } })
  const compact = size.variant('compact')
  const oldAmount = value('3px', { onActive: () => [[['.OldModificationResource'], 'display', 'block']] })
  let amount: ValueInput = oldAmount
  const original = modify(size, { type: 'expression', detail: current => add(current, amount) })
  const changed = modify(size, { type: 'expression', detail: current => add(current, '5px') })
  const currentInput = update === '替换材料' ? changed[1] : original[1]
  const other = variable('7px', { name: 'replace-modification-neighbor', address: '.OtherBox' })
  const css = compileRules([
    [['.ReplacementBox'], ...original], [['.ReplacementBox'], 'width', size], [['.ReplacementBox'], 'height', compact],
    [['.OtherBox'], 'width', other],
    [[], undefined, whenSettled(controller => {
      const node = controller.search({ key: size.key }).find(node => node.content === original[1])!
      amount = '5px'
      node.content = currentInput
      node.compileRevision++
      return true
    })],
    [[], undefined, whenSettled(controller => {
      const node = controller.search({ key: size.key }).find(node => node.content === currentInput)
      if (!node || !controller.usesContent(node, currentInput)) return false
      node.compileRevision++
      return true
    })],
  ])
  const element = mount(css, 'ReplacementBox')
  const neighbor = document.body.appendChild(document.createElement('div'))
  neighbor.className = 'OtherBox'
  expect(getComputedStyle(element).width).toBe('15px')
  expect(getComputedStyle(element).height).toBe('9px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('25px')
  expect(getComputedStyle(element).height).toBe('25px')
  expect(getComputedStyle(neighbor).width).toBe('7px')
  expect(css).not.toContain('.OldModificationResource')
})

test.each([false, true])('替换后保持共享候选与后续非交换步骤，随后撤销=%s', remove => {
  const size = variable('10px', { name: `replace-shared-${remove}`, address: '.SharedReplacement', variants: { compact: '4px' } })
  const compact = size.variant('compact')
  const original = modify(size, { type: 'expression', detail: current => add(current, '3px') }, { id: 'gain' })
  const changed = modify(size, { type: 'expression', detail: current => add(current, '5px') }, { id: 'gain' })
  const competing = modify(size, { type: 'expression', detail: current => add(current, '7px') }, { id: 'gain' })
  const rules: Rules = [
    [['.SharedReplacement', '&[data-first]'], ...original],
    [['.SharedReplacement', '&[data-second]'], ...competing],
    [['.SharedReplacement'], ...modify(size, { type: 'expression', detail: current => multiply(current, 2) })],
    [['.SharedReplacement'], 'width', size], [['.SharedReplacement'], 'height', compact],
    [[], undefined, whenSettled(controller => {
      const node = controller.search({ key: size.key }).find(node => node.content === original[1])!
      node.content = changed[1]
      node.compileRevision++
      return true
    })],
  ]
  if (remove) rules.push([[], undefined, whenSettled(controller => {
    const node = controller.search({ key: size.key }).find(node => node.content === changed[1])!
    if (!node || !controller.usesContent(node, changed[1])) return false
    controller.remove(node)
    return true
  })])
  const element = mount(compileRules(rules), 'SharedReplacement')
  expect(getComputedStyle(element).width).toBe('20px')
  element.dataset.first = ''
  expect(getComputedStyle(element).width).toBe(remove ? '20px' : '30px')
  expect(getComputedStyle(element).height).toBe(remove ? '8px' : '18px')
  element.dataset.second = ''
  expect(getComputedStyle(element).width).toBe('34px')
  expect(getComputedStyle(element).height).toBe('22px')
  delete element.dataset.second
  delete element.dataset.first
  expect(getComputedStyle(element).width).toBe('20px')
})

test('前插步骤只重连源序，不把未显式失效的闭包变化作为新输入', () => {
  const size = variable('10px', { name: 'insert-modification-size', address: '.InsertedModification' })
  let amount = '3px'
  const original = modify(size, { type: 'expression', detail: current => add(current, amount) })
  const css = compileRules([
    [['.InsertedModification'], ...original],
    [['.InsertedModification'], 'width', size],
    [[], undefined, whenSettled(controller => {
      const node = controller.search({ key: size.key }).find(node => node.content === original[1])!
      amount = '5px'
      controller.insert({ before: node, conditionPath: node.conditionPath },
        modify(size, { type: 'expression', detail: current => multiply(current, 2) }), { owner: node })
      return true
    })],
  ])
  expect(getComputedStyle(mount(css, 'InsertedModification')).width).toBe('23px')
})
