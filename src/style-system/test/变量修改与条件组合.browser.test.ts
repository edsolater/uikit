/** 变量修改的浏览器流程验证。

验证条件组合、顺序、继承和规则退出的实际结果。

用计算样式确认行为，不依赖内部步骤表示。
*/
import { declare } from '../declaration'
import { modify } from '../variable-modify'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { add, condition, createJSSContent, multiply, variable, variableCluster, value } from '../index'
import { compileRules } from '../css-root'
import { stateCondition } from '../pieces/state-conditions'
import type { Rules } from '../rule'

const row = (path: (ReturnType<typeof condition> | string)[], pair: import('../declaration').Declaration): Rules[number] => [path, ...pair]
const button = condition('.ModifyButton')
const panel = condition('.ModifyPanel')
const hover = condition('&[data-hover]')
const focus = condition('&[data-focus]')
stateCondition('modifierHover', hover)
afterEach(() => document.body.replaceChildren())

function mount(input: Rules) {
  document.body.appendChild(document.createElement('style')).textContent = compileRules(input)
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'ModifyButton'
  const neighbor = document.body.appendChild(document.createElement('div'))
  neighbor.className = 'ModifyPanel'
  return { element, neighbor }
}

test('两个组件独立组合，并在退出状态时恢复基础值', () => {
  const n = variable(1, { name: 'runtime-count' })
  const { element, neighbor } = mount([row([button], declare(n)), row([button, hover], modify(n, ({ type: 'expression' as const, detail: currentExpression => add(currentExpression, 3) }))), row([button, focus], modify(n, ({ type: 'expression' as const, detail: currentExpression => add(currentExpression, 5) }))), row([panel], declare(n)), row([panel, focus], modify(n, ({ type: 'expression' as const, detail: currentExpression => add(currentExpression, 10) }))), [[button], 'z-index', n], [[panel], 'z-index', n]])
  const read = (target = element) => getComputedStyle(target).zIndex
  expect(read()).toBe('1')
  element.dataset.hover = ''
  expect(read()).toBe('4')
  element.dataset.focus = ''
  expect(read()).toBe('9')
  expect(read(neighbor)).toBe('1')
  neighbor.dataset.focus = ''
  expect(read(neighbor)).toBe('11')
  delete element.dataset.hover
  expect(read()).toBe('6')
  delete element.dataset.focus
  expect(read()).toBe('1')
})

test.each([true, false])('状态基础 10 再修改 3 得到 13，普通引用提前=%s', (early) => {
  const n = variable(1, { name: 'state-count', states: { modifierHover: 10 } })
  const declarations: Rules = [row([button], declare(n)), row([button, hover], modify(n, ({ type: 'expression' as const, detail: currentExpression => add(currentExpression, 3) })))]
  if (early) declarations.unshift([[button], 'z-index', n])
  else declarations.push([[button], 'z-index', n])
  const { element } = mount(declarations)
  expect(getComputedStyle(element).zIndex).toBe('1')
  element.dataset.hover = ''
  expect(getComputedStyle(element).zIndex).toBe('13')
})

test('有序非交换修改支持尺寸；共享 ID 由层叠选中一步', () => {
  const size = variable('10px', { name: 'ordered-size' })
  const sizeModification = (change: { kind: string; amount: string | number }) => ({ type: 'expression' as const, detail: currentExpression => createJSSContent((resolve) => `calc(${resolve(currentExpression)} ${change.kind === 'add' ? '+' : '*'} ${resolve(change.amount)})`, [currentExpression, change.amount]) })
  const { element } = mount([row([button], declare(size)), row([button, hover], modify(size, sizeModification({ kind: 'add', amount: '2px' }))), row([button, focus], modify(size, sizeModification({ kind: 'multiply', amount: 3 }))), [[button], 'width', size]])
  element.dataset.hover = ''
  element.dataset.focus = ''
  expect(getComputedStyle(element).width).toBe('36px')
})

test('复用已有数值注册，20、200、1000 项修改都能同时生效和退出', () => {
  for (const count of [20, 200, 1000]) {
    const n = variable(1, { name: `scale-${count}`, registration: { syntax: '<number>', inherits: true, initialValue: 1 } })
    const { element } = mount([row([button], declare(n)), ...Array.from({ length: count }, () => row([button, hover], modify(n, ({ type: 'expression' as const, detail: currentExpression => add(currentExpression, 1) })))), [[button], 'z-index', n]])
    element.dataset.hover = ''
    expect(getComputedStyle(element).zIndex).toBe(String(count + 1))
    delete element.dataset.hover
    expect(getComputedStyle(element).zIndex).toBe('1')
    document.body.replaceChildren()
  }
})

test('已有尺寸与颜色注册同样允许长修改链，不依赖颜色专用机制', () => {
  const size = variable('10px', { name: 'registered-length', registration: { syntax: '<length>', inherits: true, initialValue: '10px' } })
  const color = variable('red', { name: 'registered-color', registration: { syntax: '<color>', inherits: true, initialValue: 'red' } })
  const { element } = mount([row([button], declare(size)), row([button], declare(color)), ...Array.from({ length: 200 }, () => row([button, hover], modify(size, ({ type: 'expression' as const, detail: currentExpression => add(currentExpression, '1px') })))), ...Array.from({ length: 200 }, () => row([button, hover], modify(color, ({ type: 'expression' as const, detail: currentExpression => createJSSContent((resolve) => `color-mix(in srgb, ${resolve(currentExpression)} 99%, white)`, [currentExpression]) })))), [[button], 'width', size], [[button], 'color', color]])
  element.dataset.hover = ''
  expect(getComputedStyle(element).width).toBe('210px')
  const result = getComputedStyle(element).color
  expect(result).toMatch(/^color\(srgb 1 /)
  expect(Number(result.split(' ')[2])).toBeCloseTo(1 - 0.99 ** 200, 3)
  delete element.dataset.hover
  expect(getComputedStyle(element).width).toBe('10px')
  expect(getComputedStyle(element).color).toBe('rgb(255, 0, 0)')
})

test('共享 ID 让后写条件覆盖同一步，退出后恢复仍匹配的赋值', () => {
  const n = variable(1, { name: 'shared-step' })
  const { element } = mount([row([button], declare(n)), row([button, hover], modify(n, ({ type: 'expression' as const, detail: currentExpression => add(currentExpression, 3) }), { id: 'interaction' })), row([button, focus], modify(n, ({ type: 'expression' as const, detail: currentExpression => add(currentExpression, 5) }), { id: 'interaction' })), [[button], 'z-index', n]])
  element.dataset.hover = ''
  element.dataset.focus = ''
  expect(getComputedStyle(element).zIndex).toBe('6')
  delete element.dataset.focus
  expect(getComputedStyle(element).zIndex).toBe('4')
})

test.each([false, true])('修改先于定义登记时，内部默认不能覆盖实际修改，状态路径=%s', (withState) => {
  const n = variable(1, { name: `early-modifier-${withState}` })
  const { element } = mount([row(withState ? [button, hover] : [button], modify(n, ({ type: 'expression' as const, detail: currentExpression => add(currentExpression, 3) }))), row([button], declare(n)), [[button], 'z-index', n]])
  if (withState) element.dataset.hover = ''
  expect(getComputedStyle(element).zIndex).toBe('4')
})

test('普通手写赋值仍按原顺序覆盖公开变量，不因默认节点调整被重排', () => {
  const n = variable(1, { name: 'manual-order' })
  const { element } = mount([row([button], modify(n, ({ type: 'expression' as const, detail: currentExpression => add(currentExpression, 3) }))), row([button], declare(n)), [[button], n, 20], [[button], 'z-index', n]])
  expect(getComputedStyle(element).zIndex).toBe('20')
})


test('declare 可给两个局部定义不同基础内容', () => {
  const n = variable(1, { name: 'explicit-base' })
  const { element, neighbor } = mount([row([button], declare(n, 10)), row([button], modify(n, ({ type: 'expression' as const, detail: currentExpression => add(currentExpression, 3) }))), row([panel], declare(n, 20)), row([panel], modify(n, ({ type: 'expression' as const, detail: currentExpression => add(currentExpression, 4) }))), [[button], 'z-index', n], [[panel], 'z-index', n]])
  expect(getComputedStyle(element).zIndex).toBe('13')
  expect(getComputedStyle(neighbor).zIndex).toBe('24')
})

test('晚编译的前置修改按源位置连接，编号和编译时机不决定非交换顺序', () => {
  const n = variable(1, { name: 'late-front' })
  const nModification = (change: import('../value').ValueInput) => ({ type: 'expression' as const, detail: currentExpression => {
    return createJSSContent((resolve) => `calc(${resolve(currentExpression)} ${change === 'add' ? '+ 2' : '* 3'})`, [currentExpression])
  } })
  const delayed = { compileWaveIndex: 1, onCompile(context: import('../index').JSSCompileContext, controller: import('../index').ASTController) {
    controller.insert({ before: context.node, conditionPath: context.conditionPath }, modify(n, nModification('add')), { owner: context.node })
  } }
  const { element } = mount([row([button], declare(n)), [[button], 'order', delayed], row([button], modify(n, nModification('multiply'))), [[button], 'z-index', n]])
  expect(getComputedStyle(element).zIndex).toBe('9')
})

test.each([false, true])('撤销中间修改或共享首声明后，剩余非交换步骤局部重连，共享=%s', (shared) => {
  const n = variable(1, { name: `removed-step-${shared}` })
  const nModification = (change: { operator: string; amount: number }) => ({ type: 'expression' as const, detail: currentExpression => createJSSContent((resolve) => `calc(${resolve(currentExpression)} ${change.operator} ${change.amount})`, [currentExpression]) })
  const first = modify(n, nModification({ operator: '+', amount: 2 }), shared ? { id: 'shared' } : undefined)
  const middle = modify(n, nModification({ operator: '*', amount: 3 }))
  const last = modify(n, nModification({ operator: '+', amount: 4 }), shared ? { id: 'shared' } : undefined)
  const removed = shared ? first : middle
  const cleanup = value('1', { onActive: () => [[[button], 'opacity', { onCompile(context, controller) {
    controller.remove(controller.search({}).find((node) => node.content === removed[1])!)

  } }]] })
  const { element } = mount([row([button], declare(n)), row([button], first), row([button], middle), row([button], last), [[button], 'order', cleanup], [[button], 'z-index', n]])
  expect(getComputedStyle(element).zIndex).toBe('7')
})

test.each(['& .child', '&:hover .child', '&.selected > .child', '&[data-on] .child', '&:is([data-on]) .child', '&[data-on], & .child', '& [data-symbol="&"]', '& .\\31 child'])('子元素修改前序后重新应用父位置后续规则，目标=%s', async (selector) => {
  const amount = variable(1, { name: 'descendant-ordered' })
  const amountModification = (change: { operator: string; amount: number }) => ({ type: 'expression' as const, detail: currentExpression => createJSSContent(
      resolve => `calc(${resolve(currentExpression)} ${change.operator} ${change.amount})`, [currentExpression]) })
  const childPath = condition(selector)
  const { element } = mount([
    row([button], declare(amount)),
    row([button, childPath], modify(amount, amountModification({ operator: '+', amount: 3 }))),
    row([button, focus], modify(amount, amountModification({ operator: '*', amount: 2 }))),
    [[button], 'z-index', amount], [[button, childPath], 'z-index', amount],
  ])
  element.classList.add('selected')
  if (!selector.includes(',')) element.dataset.on = ''
  element.style.width = element.style.height = '20px'
  if (selector.includes(':hover')) await userEvent.hover(element)
  const child = element.appendChild(document.createElement('span'))
  child.className = 'child 1child'
  child.dataset.symbol = '&'
  expect(getComputedStyle(child).zIndex).toBe('4')
  element.dataset.focus = ''
  expect(getComputedStyle(element).zIndex).toBe('2')
  expect(getComputedStyle(child).zIndex).toBe('8')
  delete element.dataset.focus
  expect(getComputedStyle(child).zIndex).toBe('4')
})

test('declare和modify通过Cluster默认成员生效，并保留其基础状态', () => {
  const amount = variable(1, { name: 'cluster-default-amount', states: { modifierHover: 10 } })
  const cluster = variableCluster({ default: amount, extra: variable(50, 'cluster-extra-amount') })
  const { element } = mount([
    row([button], declare(cluster, 2)),
    row([button, focus], modify(cluster, ({ type: 'expression' as const, detail: currentExpression => add(currentExpression, 3) }))),
    [[button], 'z-index', cluster],
  ])
  expect(getComputedStyle(element).zIndex).toBe('2')
  element.dataset.focus = ''
  expect(getComputedStyle(element).zIndex).toBe('5')
  element.dataset.hover = ''
  expect(getComputedStyle(element).zIndex).toBe('13')
  delete element.dataset.focus
  expect(getComputedStyle(element).zIndex).toBe('10')
})
test('无额外Variable配置的数值规则按顺序应用，CSS条件退出恢复基础值', () => {
  const first = ({ type: 'expression' as const, detail: currentExpression => add(currentExpression, 2) })
  const second = ({ type: 'expression' as const, detail: currentExpression => multiply(currentExpression, 3) })
  const amount = variable(2, 'dual-amount')
  const { element } = mount([
    row([button], declare(amount)), row([button, hover], modify(amount, first)), row([button, focus], modify(amount, second)),
    [[button], 'z-index', amount],
  ])
  element.dataset.hover = element.dataset.focus = ''
  expect(getComputedStyle(element).zIndex).toBe('12')
  delete element.dataset.hover
  expect(getComputedStyle(element).zIndex).toBe('6')
  delete element.dataset.focus
  expect(getComputedStyle(element).zIndex).toBe('2')
})
