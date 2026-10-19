/** 浏览器验证当前表达式的选择、当地递归求值与CSS运行时输入。 */
import { afterEach, expect, test } from 'vitest'
import { compileRules } from '../css-root'
import { declare } from '../operations/declare'
import { multiply } from '../pieces/contents/functions/calc'
import { variable } from '../variable'
import type { Rules } from '../rule'
import { whenSettled } from './when-settled'

afterEach(() => document.body.replaceChildren())

test.each([false, true])('消费稳定后晚到二元定义切换依赖与状态，继续改固定值=%s', fixed => {
  const base = variable(4, 'late-raw-base')
  const another = variable(5, 'late-raw-another')
  const result = variable(multiply(base, 2), { name: 'late-raw-result', states: { '&[data-phase]': current => multiply(current, 2) } })
  const initial = declare(result, multiply(base, 2))
  let rawCompiled = false
  /**
   * 标记晚到原始表达式已经编译，供后续固定值重访调度；可见依赖结果由元素值另行验证。
   */
  const replacement = () => { rawCompiled = true; return multiply(another, 3) }
  const { parent, child, neighbor } = mount([
    [['.Parent'], ...initial], [['.Parent', '.Child'], ...declare(base, 7)],
    [['.Parent', '.Child'], ...declare(another, 11)], [['.Parent', '.Child'], 'width', multiply(result, '1px')],
    [['.Parent'], 'width', multiply(result, '1px')], [['.Neighbor'], 'width', multiply(result, '1px')],
    [[], undefined, whenSettled(controller => {
      const anchor = controller.search({ key: result.key }).find(node => node.content === initial[1])!
      controller.insert({ after: anchor, conditionPath: anchor.conditionPath }, [result, replacement], { owner: anchor })
      return true
    })],
    [[], undefined, whenSettled(controller => {
      if (!rawCompiled || !fixed) return false
      const node = controller.search({ key: result.key }).find(node => node.content === replacement)!
      node.content = 20
      node.compileRevision++
      return true
    })],
  ])
  expect.soft(getComputedStyle(child).width).toBe(fixed ? '20px' : '33px')
  child.dataset.phase = ''
  expect.soft(getComputedStyle(child).width).toBe(fixed ? '40px' : '66px')
  child.style.setProperty('--late-raw-another', '7')
  child.style.setProperty('--late-raw-base', '9')
  expect.soft(getComputedStyle(child).width).toBe(fixed ? '40px' : '42px')
  delete child.dataset.phase
  expect.soft(getComputedStyle(child).width).toBe(fixed ? '20px' : '21px')
  expect.soft(getComputedStyle(parent).width).toBe(fixed ? '20px' : '15px')
  expect.soft(getComputedStyle(neighbor).width).toBe('8px')
})

/**
 * 挂载一次编译CSS，返回父、子及兄弟Address的元素，供各案例比较作用域结果与更新。
 */
function mount(rules: Rules) {
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileRules(rules)
  const parent = document.body.appendChild(document.createElement('div'))
  parent.className = 'Parent'
  const child = parent.appendChild(document.createElement('div'))
  child.className = 'Child'
  const neighbor = document.body.appendChild(document.createElement('div'))
  neighbor.className = 'Neighbor'
  return { style, parent, child, neighbor }
}

test.each(['declare', '二元'])('祖先固定20保持当前基础，自身状态得到40，兄弟仍使用创建公式：%s', entry => {
  const base = variable(4, 'browser-current-base')
  const result = variable(multiply(base, 2), { name: 'browser-current-result', states: { '&[data-phase]': current => multiply(current, 2) } })
  const definition: Rules[number] = entry === 'declare' ? [['.Parent'], ...declare(result, 20)] : [['.Parent'], result, 20]
  const { child, neighbor } = mount([
    definition,
    [['.Parent', '.Child'], ...declare(base, 7)],
    [['.Parent', '.Child'], 'width', multiply(result, '1px')],
    [['.Neighbor'], 'width', multiply(result, '1px')],
  ])
  expect.soft(getComputedStyle(child).width).toBe('20px')
  expect.soft(getComputedStyle(neighbor).width).toBe('8px')
  child.dataset.phase = ''
  expect.soft(getComputedStyle(child).width).toBe('40px')
  delete child.dataset.phase
  child.style.setProperty('--browser-current-base', '9')
  expect.soft(getComputedStyle(child).width).toBe('20px')
})

test('最近显式表达式优先于祖先及兄弟，替换后退出旧关系', () => {
  const base = variable(4, 'browser-replace-base')
  const another = variable(5, 'browser-replace-another')
  const result = variable(multiply(base, 2), 'browser-replace-result')
  const rules: Rules = [
    [['.Parent'], ...declare(result, multiply(another, 3))],
    [['.Parent', '.Child'], ...declare(result, multiply(another, 4))],
    [['.Parent', '.Child'], ...declare(another, 5)],
    [['.Parent', '.Child'], 'width', multiply(result, '1px')],
    [['.Neighbor'], ...declare(result, 99)],
    [['.Neighbor'], 'width', multiply(result, '1px')],
  ]
  const { style, child, neighbor } = mount(rules)
  expect.soft(getComputedStyle(child).width).toBe('20px')
  expect.soft(getComputedStyle(neighbor).width).toBe('99px')
  child.style.setProperty('--browser-replace-another', '7')
  expect.soft(getComputedStyle(child).width).toBe('28px')
  child.style.setProperty('--browser-replace-base', '11')
  expect.soft(getComputedStyle(child).width).toBe('28px')
  rules.splice(1, 1)
  style.textContent = compileRules(rules)
  expect.soft(getComputedStyle(child).width).toBe('21px')
  rules[0] = [['.Parent'], ...declare(result, 20)]
  style.textContent = compileRules(rules)
  child.style.setProperty('--browser-replace-another', '9')
  expect.soft(getComputedStyle(child).width).toBe('20px')
})

test.each(['默认', '显式', '仅状态'])('当地输入声明触发三层联动：%s，提交后修改CSS输入仍立即响应', mode => {
  const base = variable(4, 'browser-recursive-base')
  const middle = variable(multiply(base, 2), 'browser-recursive-middle')
  const result = mode === '仅状态'
    ? variable(1, { name: 'browser-recursive-result', states: { '&[data-phase]': multiply(middle, 3) } })
    : variable(multiply(middle, 3), 'browser-recursive-result')
  const { child, neighbor } = mount([
    ...(mode === '显式' ? [[['.Parent'], ...declare(result)] as Rules[number], [['.Neighbor'], ...declare(result)] as Rules[number]] : []),
    [['.Parent'], 'width', multiply(result, '1px')],
    [['.Parent', '.Child'], ...declare(base, 4)],
    [['.Parent', '.Child'], 'width', multiply(result, '1px')],
    [['.Neighbor'], 'width', multiply(result, '1px')],
  ])
  expect.soft(getComputedStyle(child).width).toBe(mode === '仅状态' ? '1px' : '24px')
  if (mode === '仅状态') child.dataset.phase = ''
  expect.soft(getComputedStyle(child).width).toBe('24px')
  child.style.setProperty('--browser-recursive-base', '7')
  expect.soft(getComputedStyle(child).width).toBe('42px')
  expect.soft(getComputedStyle(neighbor).width).toBe(mode === '仅状态' ? '1px' : '24px')
  if (mode === '仅状态') {
    delete child.dataset.phase
    expect.soft(getComputedStyle(child).width).toBe('1px')
  }
})

test('更窄条件进入与退出保留普通默认，撤销覆盖恢复默认', () => {
  const size = variable('4px', 'browser-narrow-default')
  const rules: Rules = [
    [['.Parent'], 'width', size],
    [['.Parent', '&[data-phase]'], ...declare(size, '8px')],
    [['.Neighbor'], 'width', size],
  ]
  const { style, parent, neighbor } = mount(rules)
  expect.soft(getComputedStyle(parent).width).toBe('4px')
  expect.soft(getComputedStyle(neighbor).width).toBe('4px')
  parent.dataset.phase = ''
  expect.soft(getComputedStyle(parent).width).toBe('8px')
  delete parent.dataset.phase
  expect.soft(getComputedStyle(parent).width).toBe('4px')
  parent.dataset.phase = ''
  rules.splice(1, 1)
  style.textContent = compileRules(rules)
  expect.soft(getComputedStyle(parent).width).toBe('4px')
})
