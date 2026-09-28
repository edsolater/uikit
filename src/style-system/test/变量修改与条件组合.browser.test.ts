/** 将同一份 CSS 交给浏览器，验证条件组合、退出与继承。 */
import { afterEach, expect, test } from 'vitest'
import { condition, createJSSContent, variable, value } from '../index'
import { compileRules } from '../css-root'
import { stateCondition } from '../pieces/state-conditions'
import type { Rules } from '../rule'

const add = (current: unknown, change: unknown) => createJSSContent((read) => `calc(${read(current)} + ${read(change)})`, [current, change])
const row = (path: (ReturnType<typeof condition> | string)[], pair: ReturnType<import('../variable').Variable['declare']>): Rules[number] => [path, ...pair]
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
  const n = variable(1, { name: 'runtime-count', modification: { apply: add } })
  const { element, neighbor } = mount([row([button], n.declare()), row([button, hover], n.modify(3)), row([button, focus], n.modify(5)), row([panel], n.declare()), row([panel, focus], n.modify(10)), [[button], 'z-index', n], [[panel], 'z-index', n]])
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
  const n = variable(1, { name: 'state-count', states: { modifierHover: 10 }, modification: { apply: add } })
  const declarations: Rules = [row([button], n.declare()), row([button, 'modifierHover'], n.modify(3))]
  if (early) declarations.unshift([[button], 'z-index', n])
  else declarations.push([[button], 'z-index', n])
  const { element } = mount(declarations)
  expect(getComputedStyle(element).zIndex).toBe('1')
  element.dataset.hover = ''
  expect(getComputedStyle(element).zIndex).toBe('13')
})

test('有序非交换修改支持尺寸；共享 ID 由层叠选中一步', () => {
  const size = variable('10px', { name: 'ordered-size', modification: { apply: (current, change: { kind: string; amount: string | number }) => createJSSContent((read) => `calc(${read(current)} ${change.kind === 'add' ? '+' : '*'} ${read(change.amount)})`, [current, change.amount]) } })
  const { element } = mount([row([button], size.declare()), row([button, hover], size.modify({ kind: 'add', amount: '2px' })), row([button, focus], size.modify({ kind: 'multiply', amount: 3 })), [[button], 'width', size]])
  element.dataset.hover = ''
  element.dataset.focus = ''
  expect(getComputedStyle(element).width).toBe('36px')
})

test('后代修改只在原处赋步骤，不重建继承的最终变量', () => {
  const n = variable(1, { name: 'inherited-count', modification: { apply: add } })
  const childPath = condition('& .child')
  const { element } = mount([row([button], n.declare()), row([button, childPath], n.modify(3)), [[button], 'z-index', n], [[button, childPath], 'z-index', n]])
  const child = element.appendChild(document.createElement('span'))
  child.className = 'child'
  expect(getComputedStyle(element).zIndex).toBe('1')
  expect(getComputedStyle(child).zIndex).toBe('1')
  expect(getComputedStyle(child).getPropertyValue('--inherited-count-modify-1-step-1')).toContain('+ 3')
})

test('复用已有数值注册，20、200、1000 项修改都能同时生效和退出', () => {
  for (const count of [20, 200, 1000]) {
    const n = variable(1, { name: `scale-${count}`, registration: { syntax: '<number>', inherits: true, initialValue: 1 }, modification: { apply: add } })
    const { element } = mount([row([button], n.declare()), ...Array.from({ length: count }, () => row([button, hover], n.modify(1))), [[button], 'z-index', n]])
    const start = performance.now()
    element.dataset.hover = ''
    expect(getComputedStyle(element).zIndex).toBe(String(count + 1))
    delete element.dataset.hover
    expect(getComputedStyle(element).zIndex).toBe('1')
    console.info(`修改规模 ${count}：激活与退出并读取结果 ${performance.now() - start}ms`)
    document.body.replaceChildren()
  }
})

test('已有尺寸与颜色注册同样允许长修改链，不依赖颜色专用机制', () => {
  const size = variable('10px', { name: 'registered-length', registration: { syntax: '<length>', inherits: true, initialValue: '10px' }, modification: { apply: add } })
  const color = variable('red', { name: 'registered-color', registration: { syntax: '<color>', inherits: true, initialValue: 'red' }, modification: { apply: (current) => createJSSContent((read) => `color-mix(in srgb, ${read(current)} 99%, white)`, [current]) } })
  const { element } = mount([row([button], size.declare()), row([button], color.declare()), ...Array.from({ length: 200 }, () => row([button, hover], size.modify('1px'))), ...Array.from({ length: 200 }, () => row([button, hover], color.modify(undefined))), [[button], 'width', size], [[button], 'color', color]])
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
  const n = variable(1, { name: 'shared-step', modification: { apply: add } })
  const { element } = mount([row([button], n.declare()), row([button, hover], n.modify(3, { id: 'interaction' })), row([button, focus], n.modify(5, { id: 'interaction' })), [[button], 'z-index', n]])
  element.dataset.hover = ''
  element.dataset.focus = ''
  expect(getComputedStyle(element).zIndex).toBe('6')
  delete element.dataset.focus
  expect(getComputedStyle(element).zIndex).toBe('4')
})

test.each([false, true])('修改先于定义登记时，内部默认不能覆盖实际修改，状态路径=%s', (withState) => {
  const n = variable(1, { name: `early-modifier-${withState}`, modification: { apply: add } })
  const { element } = mount([row(withState ? [button, 'modifierHover'] : [button], n.modify(3)), row([button], n.declare()), [[button], 'z-index', n]])
  if (withState) element.dataset.hover = ''
  expect(getComputedStyle(element).zIndex).toBe('4')
})

test('普通手写赋值仍按原顺序覆盖公开变量，不因默认节点调整被重排', () => {
  const n = variable(1, { name: 'manual-order', modification: { apply: add } })
  const { element } = mount([row([button], n.modify(3)), row([button], n.declare()), [[button], n, 20], [[button], 'z-index', n]])
  expect(getComputedStyle(element).zIndex).toBe('20')
})


test('declare 可给两个局部定义不同基础内容', () => {
  const n = variable(1, { name: 'explicit-base', modification: { apply: add } })
  const { element, neighbor } = mount([row([button], n.declare(10)), row([button], n.modify(3)), row([panel], n.declare(20)), row([panel], n.modify(4)), [[button], 'z-index', n], [[panel], 'z-index', n]])
  expect(getComputedStyle(element).zIndex).toBe('13')
  expect(getComputedStyle(neighbor).zIndex).toBe('24')
})

test('晚解析的前置修改按源位置连接，编号和解析时机不决定非交换顺序', () => {
  let additions = 0
  let multiplications = 0
  const n = variable(1, { name: 'late-front', modification: { apply: (current, change) => {
    if (change === 'add') additions++
    else multiplications++
    return createJSSContent((read) => `calc(${read(current)} ${change === 'add' ? '+ 2' : '* 3'})`, [current])
  } } })
  const delayed = { parseWaveIndex: 1, parse(controller: import('../index').ASTController) {
    controller.insert(controller.conditionPath, ...n.modify('add'))
    return undefined
  } }
  const { element } = mount([row([button], n.declare()), [[button], 'order', delayed], row([button], n.modify('multiply')), [[button], 'z-index', n]])
  expect(getComputedStyle(element).zIndex).toBe('9')
  expect(additions).toBe(1)
  expect(multiplications).toBe(1)
})

test.each([false, true])('撤销中间修改或共享首声明后，剩余非交换步骤局部重连，共享=%s', (shared) => {
  const n = variable(1, { name: `removed-step-${shared}`, modification: { apply: (current, change: { operator: string; amount: number }) => createJSSContent((read) => `calc(${read(current)} ${change.operator} ${change.amount})`, [current]) } })
  const first = n.modify({ operator: '+', amount: 2 }, shared ? { id: 'shared' } : undefined)
  const middle = n.modify({ operator: '*', amount: 3 })
  const last = n.modify({ operator: '+', amount: 4 }, shared ? { id: 'shared' } : undefined)
  const removed = shared ? first : middle
  const cleanup = value('1', { onActive: () => [[[button], 'opacity', { parse(controller) {
    controller.removeNode(controller.nodes().find((node) => node.content === removed[1])!)
    return undefined
  } }]] })
  const { element } = mount([row([button], n.declare()), row([button], first), row([button], middle), row([button], last), [[button], 'order', cleanup], [[button], 'z-index', n]])
  expect(getComputedStyle(element).zIndex).toBe('7')
})
