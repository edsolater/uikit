/** 在浏览器验证根基础值、全树显式声明边界和消费处派生状态。 */
import { afterEach, expect, test } from 'vitest'
import { compileRules } from '../css-root'
import { variable } from '../variable'
import { declare } from '../declaration'
import { condition } from '../condition'
import { stateCondition } from '../pieces/state-conditions'
import { multiply } from '../pieces/contents/functions/calc'

stateCondition('rootContractHover', condition('&:where([data-root-hover])'))
stateCondition('rootContractActive', condition('&:where([data-root-active])'))
afterEach(() => document.body.replaceChildren())

test('派生默认与交互状态在消费元素读取局部来源，邻居沿用根来源', () => {
  const source = variable('10px', 'root-browser-source')
  const direct = variable(source, 'root-browser-direct')
  const derived = variable({ default: source,
    rootContractHover: multiply(source, 2), rootContractActive: multiply(source, 3),
  }, 'root-browser-derived')
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [['.Consumer'], 'width', derived],
    [['.Consumer'], 'margin-left', direct],
  ])
  const local = document.body.appendChild(document.createElement('div'))
  local.className = 'Consumer'
  local.style.setProperty('--root-browser-source', '7px')
  const neighbor = document.body.appendChild(document.createElement('div'))
  neighbor.className = 'Consumer'
  expect(getComputedStyle(local).width).toBe('7px')
  expect(getComputedStyle(local).marginLeft).toBe('7px')
  expect(getComputedStyle(neighbor).width).toBe('10px')
  local.dataset.rootHover = ''
  expect(getComputedStyle(local).width).toBe('14px')
  expect(getComputedStyle(neighbor).width).toBe('10px')
  local.dataset.rootActive = ''
  expect(getComputedStyle(local).width).toBe('21px')
  delete local.dataset.rootActive
  delete local.dataset.rootHover
  expect(getComputedStyle(local).width).toBe('7px')
})

test('别处显式声明阻止根默认，未继承该声明的邻居没有默认值', () => {
  const size = variable('10px', 'root-browser-explicit')
  const css = compileRules([
    [['.Defined'], ...declare(size, '7px')], [['.Consumer'], 'height', size],
  ])
  expect(css).not.toContain(':root')
  expect(css).not.toContain('10px')
  document.body.appendChild(document.createElement('style')).textContent = css
  const local = document.body.appendChild(document.createElement('div'))
  local.className = 'Defined Consumer'
  const neighbor = document.body.appendChild(document.createElement('div'))
  neighbor.className = 'Consumer'
  expect(getComputedStyle(local).height).toBe('7px')
  expect(getComputedStyle(neighbor).getPropertyValue('--root-browser-explicit')).toBe('')
  expect(getComputedStyle(neighbor).height).not.toBe('10px')
})

test('撤销最后显式派生声明后恢复根关系及消费处局部重算', () => {
  const source = variable('10px', 'root-restored-source')
  const derived = variable(source, 'root-restored-derived')
  const definition = declare(derived, '20px')
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [['.Other'], ...definition], [['.Consumer'], 'width', derived],
    [[], undefined, { compileWaveIndex: 3, onCompile(context, controller) {
      controller.remove(controller.search({ key: derived.key }).find(node => node.content === definition[1])!)
      controller.remove(context.node)
    } }],
  ])
  const local = document.body.appendChild(document.createElement('div'))
  local.className = 'Consumer'
  local.style.setProperty('--root-restored-source', '7px')
  expect(getComputedStyle(local).width).toBe('7px')
})
