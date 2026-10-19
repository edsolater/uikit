/** 在浏览器验证根默认保障、当地显式覆盖和消费处派生状态。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { compileRules } from '../css-root'
import { variable } from '../variable'
import { declare } from '../operations/declare'
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
    [['.Consumer'], ...declare(source, '10px')],
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

test('别处显式声明保留当地覆盖，邻居仍取得根默认', () => {
  const size = variable('10px', 'root-browser-explicit')
  const css = compileRules([
    [['.Defined'], ...declare(size, '7px')], [['.Consumer'], 'height', size],
  ])
  document.body.appendChild(document.createElement('style')).textContent = css
  const local = document.body.appendChild(document.createElement('div'))
  local.className = 'Defined Consumer'
  const neighbor = document.body.appendChild(document.createElement('div'))
  neighbor.className = 'Consumer'
  expect(getComputedStyle(local).height).toBe('7px')
  expect(getComputedStyle(neighbor).getPropertyValue('--root-browser-explicit').trim()).toBe('10px')
  expect(getComputedStyle(neighbor).height).toBe('10px')
})

test('撤销最后显式派生声明后恢复根关系及消费处局部重算', () => {
  const source = variable('10px', 'root-restored-source')
  const derived = variable(source, 'root-restored-derived')
  const definition = declare(derived, '20px')
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [['.Other'], ...definition], [['.Consumer'], 'width', derived],
    [['.Consumer'], ...declare(source, '10px')],
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

test('固定基础的自身hover在两个实例独立生效，root兜底不发布该交互状态', async () => {
  const size = variable('10px', { name: 'root-independent-hover', states: { hover: current => multiply(current, 2) } })
  const css = compileRules([[['.HoverProbe'], 'width', size]])
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = css
  const rootStates: string[] = []
  function inspect(rules: CSSRuleList, path: string[] = []) {
    for (const rule of rules) {
      const headers = rule instanceof CSSStyleRule ? [...path, rule.selectorText] : path
      const address = headers.join(' ')
      if (rule instanceof CSSStyleRule && address.includes(':root') && address.includes(':hover')
        && rule.style.getPropertyValue('--root-independent-hover')) rootStates.push(address)
      if (rule instanceof CSSGroupingRule || rule instanceof CSSStyleRule) inspect(rule.cssRules, headers)
    }
  }
  inspect(style.sheet!.cssRules)
  expect.soft(rootStates).toEqual([])
  const first = document.body.appendChild(document.createElement('button'))
  first.className = 'HoverProbe'
  const second = document.body.appendChild(document.createElement('button'))
  second.className = 'HoverProbe'
  for (const element of [first, second]) {
    element.style.padding = '0'
    element.style.border = '0'
    element.style.height = '20px'
  }
  expect.soft(getComputedStyle(first).width).toBe('10px')
  expect.soft(getComputedStyle(second).width).toBe('10px')
  await userEvent.hover(first)
  expect.soft(getComputedStyle(first).width).toBe('20px')
  expect.soft(getComputedStyle(second).width).toBe('10px')
  await userEvent.hover(second)
  expect.soft(getComputedStyle(first).width).toBe('10px')
  expect.soft(getComputedStyle(second).width).toBe('20px')
  await userEvent.unhover(second)
})
