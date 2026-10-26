import { token, type TokenInput } from '../token'
/** 修改材料替换后采用当前规则，退出时恢复基础，不沿用旧结果或重复累计。 */
import { afterEach, expect, test } from 'vitest'
import { compileRules } from '../css-root'
import { add, multiply } from '../pieces/contents/functions/calc'
import { modify } from '../operations/modify'
import type { Rules } from '../rule'
import { whenSettled } from './when-settled'

afterEach(() => document.body.replaceChildren())

function mount(css: string, className: string) {
  document.body.appendChild(document.createElement('style')).textContent = css
  const element = document.body.appendChild(document.createElement('div'))
  element.className = className
  return element
}

test('替换修改材料后默认与固定状态更新，旧配方资源退出', () => {
  const size = token('10px', { name: 'replace-modification-size', address: '.ReplacementBox', state: { '&[data-phase]': '20px' } })
  const oldAmount = token('3px', { onFirstScan: () => [[['.OldModificationResource'], 'display', 'block']] })
  let amount: TokenInput = oldAmount
  const original = modify(size, { type: 'expression', detail: current => add(current, amount) })
  const changed = modify(size, { type: 'expression', detail: current => add(current, '5px') })
  const currentInput = changed[1]
  const other = token('7px', { name: 'replace-modification-neighbor', address: '.OtherBox' })
  const css = compileRules([
    [['.ReplacementBox'], ...original], [['.ReplacementBox'], 'width', size],
    [['.OtherBox'], 'width', other],
    [[], undefined, whenSettled(controller => {
      const node = controller.search({ key: size }).find(node => node.content === original[1])!
      amount = '5px'
      node.content = currentInput
      node.compileRevision++
      return true
    })],
    [[], undefined, whenSettled(controller => {
      const node = controller.search({ key: size }).find(node => node.content === currentInput)
      if (!node || !controller.usesContent(node, currentInput)) return false
      node.compileRevision++
      return true
    })],
  ])
  const element = mount(css, 'ReplacementBox')
  const neighbor = document.body.appendChild(document.createElement('div'))
  neighbor.className = 'OtherBox'
  expect(getComputedStyle(element).width).toBe('15px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('25px')
  expect(getComputedStyle(neighbor).width).toBe('7px')
  expect(css).not.toContain('.OldModificationResource')
})

test.each([false, true])('替换后保持共享候选与后续非交换步骤，随后撤销=%s', remove => {
  const size = token('10px', { name: `replace-shared-${remove}`, address: '.SharedReplacement' })
  const original = modify(size, { type: 'expression', detail: current => add(current, '3px') }, { id: 'gain' })
  const changed = modify(size, { type: 'expression', detail: current => add(current, '5px') }, { id: 'gain' })
  const competing = modify(size, { type: 'expression', detail: current => add(current, '7px') }, { id: 'gain' })
  const rules: Rules = [
    [['.SharedReplacement', '&[data-first]'], ...original],
    [['.SharedReplacement', '&[data-second]'], ...competing],
    [['.SharedReplacement'], ...modify(size, { type: 'expression', detail: current => multiply(current, 2) })],
    [['.SharedReplacement'], 'width', size],
    [[], undefined, whenSettled(controller => {
      const node = controller.search({ key: size }).find(node => node.content === original[1])!
      node.content = changed[1]
      node.compileRevision++
      return true
    })],
  ]
  if (remove) rules.push([[], undefined, whenSettled(controller => {
    const node = controller.search({ key: size }).find(node => node.content === changed[1])!
    if (!node || !controller.usesContent(node, changed[1])) return false
    controller.remove(node)
    return true
  })])
  const element = mount(compileRules(rules), 'SharedReplacement')
  expect(getComputedStyle(element).width).toBe('20px')
  element.dataset.first = ''
  expect(getComputedStyle(element).width).toBe(remove ? '20px' : '30px')
  element.dataset.second = ''
  expect(getComputedStyle(element).width).toBe('34px')
  delete element.dataset.second
  delete element.dataset.first
  expect(getComputedStyle(element).width).toBe('20px')
})

test('前插步骤只重连源序，不把闭包变化作为新的输入', () => {
  const size = token('10px', { name: 'insert-modification-size', address: '.InsertedModification' })
  let amount = '3px'
  const original = modify(size, { type: 'expression', detail: current => add(current, amount) })
  const css = compileRules([
    [['.InsertedModification'], ...original],
    [['.InsertedModification'], 'width', size],
    [[], undefined, whenSettled(controller => {
      const node = controller.search({ key: size }).find(node => node.content === original[1])!
      amount = '5px'
      controller.insert({ before: node, conditionPath: node.conditionPath },
        modify(size, { type: 'expression', detail: current => multiply(current, 2) }), { owner: node })
      return true
    })],
  ])
  expect(getComputedStyle(mount(css, 'InsertedModification')).width).toBe('23px')
})
