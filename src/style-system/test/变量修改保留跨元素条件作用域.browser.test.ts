/** 修改规则跨元素作用域的浏览器验证。
 *
 * 验证后代重算、状态宿主、共享步骤和条件层叠的实际结果。
 *
 * CSS 继承不能自动重算后代的前序规则，需要通过计算样式检验这些组合。
 */
import { afterEach, test, expect } from 'vitest'
import { compileRules } from '../css-root'
import { condition } from '../condition'
import { declare } from '../declaration'
import { modify } from '../variable-modify'
import { variable } from '../variable'
import { createJSSContent } from '../content'
import { modification } from '../modification'
afterEach(() => document.body.replaceChildren())

const parent = condition('.Parent')
const child = condition('& .child')
const grandchild = condition('& .grandchild')
const sibling = condition('& .sibling')
const amount = (name: string) => variable(1, { name })
const amountModification = (change: { operator: string; amount: number }) => modification(currentExpression => createJSSContent(resolve => `calc(${resolve(currentExpression)} ${change.operator} ${change.amount})`, [currentExpression]))
const read = (selector: string) => getComputedStyle(document.querySelector(selector)!).zIndex
const mount = (css: string) => { document.body.innerHTML = `<style>${css}</style><div class="Parent"><div class="child"><span class="grandchild"></span><span class="child nested-child"></span></div><div class="sibling"><span class="child sibling-child"></span></div></div>` }
test('同一后代的两条独立规则依次加三再乘二', () => {
  const n = amount('same-descendant')
  mount(compileRules([
    [[parent], ...declare(n)],
    [[parent, child], ...modify(n, amountModification({ operator: '+', amount: 3 }))],
    [[parent, child], ...modify(n, amountModification({ operator: '*', amount: 2 }))],
    [[parent], 'z-index', n], [[parent, child], 'z-index', n],
  ]))
  const observed = { parent: read('.Parent'), child: read('.Parent > .child'), nestedChild: read('.nested-child') }
  expect(observed).toEqual({ parent: '1', child: '8', nestedChild: '8' })
})
test('兄弟路径分别修改自己的结果', () => {
  const n = amount('sibling-descendant')
  mount(compileRules([
    [[parent], ...declare(n)],
    [[parent, child], ...modify(n, amountModification({ operator: '+', amount: 3 }))],
    [[parent, sibling], ...modify(n, amountModification({ operator: '*', amount: 2 }))],
    [[parent], 'z-index', n], [[parent, child], 'z-index', n], [[parent, sibling], 'z-index', n],
  ]))
  const observed = { parent: read('.Parent'), child: read('.Parent > .child'), sibling: read('.sibling') }
  expect(observed).toEqual({ parent: '1', child: '4', sibling: '2' })
})
test('两层后代从已有结果继续修改', () => {
  const n = amount('two-depth-descendant')
  mount(compileRules([
    [[parent], ...declare(n)],
    [[parent, child], ...modify(n, amountModification({ operator: '+', amount: 3 }))],
    [[parent, child, grandchild], ...modify(n, amountModification({ operator: '*', amount: 2 }))],
    [[parent], 'z-index', n], [[parent, child], 'z-index', n], [[parent, child, grandchild], 'z-index', n],
  ]))
  const observed = { parent: read('.Parent'), child: read('.Parent > .child'), grandchild: read('.grandchild') }
  expect(observed).toEqual({ parent: '1', child: '4', grandchild: '8' })
})

test('未显式声明的同类后代继承祖先的完整规则', () => {
  const n = amount('nested-state-subject')
  const active = condition('&[data-active]')
  mount(compileRules([
    [[parent], ...declare(n)],
    [[parent, child], ...modify(n, amountModification({ operator: '+', amount: 3 }))],
    [[parent, child, active], ...modify(n, amountModification({ operator: '*', amount: 2 }))],
    [[parent], 'z-index', n], [[parent, child], 'z-index', n],
  ]))
  const outer = document.querySelector('.Parent > .child')!
  const inner = document.querySelector('.nested-child')!
  outer.setAttribute('data-active', '')
  const outerOnly = { outer: getComputedStyle(outer).zIndex, inner: getComputedStyle(inner).zIndex }
  outer.removeAttribute('data-active')
  inner.setAttribute('data-active', '')
  const innerOnly = { outer: getComputedStyle(outer).zIndex, inner: getComputedStyle(inner).zIndex }
  expect(outerOnly).toEqual({ outer: '8', inner: '8' })
  expect(innerOnly).toEqual({ outer: '4', inner: '8' })
})

test('一个Condition包含两层后代时仍应用较浅宿主的后续状态规则', () => {
  const n = amount('compound-depth-subject')
  const member = condition('& .child .grandchild')
  const shallowerActive = condition('& .child[data-active]')
  mount(compileRules([
    [[parent], ...declare(n)],
    [[parent, member], ...modify(n, amountModification({ operator: '+', amount: 3 }))],
    [[parent, shallowerActive], ...modify(n, amountModification({ operator: '*', amount: 2 }))],
    [[parent], 'z-index', n], [[parent, member], 'z-index', n], [[parent, shallowerActive], 'z-index', n],
  ]))
  const outer = document.querySelector('.Parent > .child')!
  const inner = document.querySelector('.grandchild')!
  const before = getComputedStyle(inner).zIndex
  outer.setAttribute('data-active', '')
  const after = getComputedStyle(inner).zIndex
  expect({ before, after }).toEqual({ before: '4', after: '8' })
})

test('登记状态在父宿主命中时继续作用于子结果，退出时恢复', async () => {
  const { stateCondition, appendStateCondition } = await import('../pieces/state-conditions')
  const activeState = stateCondition('parent-modifier-active', condition('&[data-active]'))
  const n = amount('named-state-host')
  mount(compileRules([
    [[parent], ...declare(n)],
    [[parent, child], ...modify(n, amountModification({ operator: '+', amount: 3 }))],
    [[parent], 'order', { onCompile(context, controller) {
      controller.insert({ before: context.node, conditionPath: appendStateCondition(context.conditionPath, activeState) },
        modify(n, amountModification({ operator: '*', amount: 2 })), { owner: context.node })
      controller.setContent(context, 1)
    } }],
    [[parent], 'z-index', n], [[parent, child], 'z-index', n],
  ]))
  const outer = document.querySelector('.Parent')!
  const target = document.querySelector('.Parent > .child')!
  const before = getComputedStyle(target).zIndex
  outer.setAttribute('data-active', '')
  const after = getComputedStyle(target).zIndex
  const parentActive = getComputedStyle(outer).zIndex
  outer.removeAttribute('data-active')
  const exited = getComputedStyle(target).zIndex
  expect(parentActive).toBe('2')
  expect({ before, after, exited }).toEqual({ before: '4', after: '8', exited: '4' })
})

test('函数声明与修改仍消费Variable自己的按需资源', () => {
  const resource = condition('.ActivationResource')
  const n = variable(1, { name: 'activation-subject',
    onActive: () => [[[resource], 'opacity', 0.4]],
  })
  const nModification = (delta: number) => modification(currentExpression => createJSSContent(resolve => `calc(${resolve(currentExpression)} + ${delta})`, [currentExpression]))
  const css = compileRules([
    [[parent], ...declare(n)],
    [[parent], ...modify(n, nModification(2))],
  ])
  document.body.innerHTML = `<style>${css}</style><div class="ActivationResource"></div>`
  const opacity = getComputedStyle(document.querySelector('.ActivationResource')!).opacity
  expect(opacity).toBe('0.4')
})

test('属性字符串中的与号不会把后代误认为来源元素', () => {
  const n = amount('attribute-ampersand-subject')
  const marked = condition('& [data-symbol="&"]')
  const active = condition('&[data-active]')
  mount(compileRules([
    [[parent], ...declare(n)],
    [[parent, marked], ...modify(n, amountModification({ operator: '+', amount: 3 }))],
    [[parent, active], ...modify(n, amountModification({ operator: '*', amount: 2 }))],
    [[parent], 'z-index', n], [[parent, marked], 'z-index', n],
  ]))
  const outer = document.querySelector('.Parent')!
  const target = document.querySelector('.Parent > .child')!
  target.setAttribute('data-symbol', '&')
  const before = getComputedStyle(target).zIndex
  outer.setAttribute('data-active', '')
  const after = getComputedStyle(target).zIndex
  expect({ before, after }).toEqual({ before: '4', after: '8' })
})

test('共同layer前缀内的父条件规则仍在子位置生效', () => {
  const n = amount('shared-layer-subject')
  const layer = condition('@layer component')
  const active = condition('&[data-active]')
  mount(compileRules([
    [[layer, parent], ...declare(n)],
    [[layer, parent, child], ...modify(n, amountModification({ operator: '+', amount: 3 }))],
    [[layer, parent, active], ...modify(n, amountModification({ operator: '*', amount: 2 }))],
    [[layer, parent], 'z-index', n], [[layer, parent, child], 'z-index', n],
  ]))
  const outer = document.querySelector('.Parent')!
  const target = document.querySelector('.Parent > .child')!
  const before = getComputedStyle(target).zIndex
  outer.setAttribute('data-active', '')
  const after = getComputedStyle(target).zIndex
  expect({ before, after }).toEqual({ before: '4', after: '8' })
})

test('后代伪元素的修改继续应用父宿主后续规则', () => {
  const n = amount('descendant-pseudo-subject')
  const pseudo = condition('& .child::before')
  const active = condition('&[data-active]')
  mount(compileRules([
    [[parent], ...declare(n)],
    [[parent, pseudo], ...modify(n, amountModification({ operator: '+', amount: 3 }))],
    [[parent, active], ...modify(n, amountModification({ operator: '*', amount: 2 }))],
    [[parent, pseudo], 'z-index', n], [[parent, pseudo], 'content', '"标记"'],
  ]))
  const outer = document.querySelector('.Parent')!
  const target = document.querySelector('.Parent > .child')!
  const before = getComputedStyle(target, '::before').zIndex
  outer.setAttribute('data-active', '')
  const after = getComputedStyle(target, '::before').zIndex
  expect({ before, after }).toEqual({ before: '4', after: '8' })
})

test('同ID局部命中覆盖父宿主继承赋值', () => {
  const n = amount('shared-scope-subject')
  const active = condition('&[data-active]')
  const focus = condition('&[data-focus]')
  mount(compileRules([
    [[parent], ...declare(n)],
    [[parent, child], ...modify(n, amountModification({ operator: '+', amount: 3 }))],
    [[parent, active], ...modify(n, amountModification({ operator: '*', amount: 2 }), { id: 'shared' })],
    [[parent, child, focus], ...modify(n, amountModification({ operator: '*', amount: 4 }), { id: 'shared' })],
    [[parent], 'z-index', n], [[parent, child], 'z-index', n],
  ]))
  const outer = document.querySelector('.Parent')!
  const target = document.querySelector('.Parent > .child')!
  outer.setAttribute('data-active', '')
  const inherited = getComputedStyle(target).zIndex
  target.setAttribute('data-focus', '')
  const local = getComputedStyle(target).zIndex
  expect({ inherited, local }).toEqual({ inherited: '8', local: '16' })
})

test('同ID多条祖先规则的胜出条件在父元素与后代重算中一致', () => {
  const n = amount('inherited-specificity-subject')
  const stronger = condition('&[data-active][data-strong]')
  const weaker = condition('&[data-active]')
  mount(compileRules([
    [[parent], ...declare(n)],
    [[parent, child], ...modify(n, amountModification({ operator: '+', amount: 3 }))],
    [[parent, stronger], ...modify(n, amountModification({ operator: '*', amount: 2 }), { id: 'shared' })],
    [[parent, weaker], ...modify(n, amountModification({ operator: '*', amount: 4 }), { id: 'shared' })],
    [[parent], 'z-index', n], [[parent, child], 'z-index', n],
  ]))
  const outer = document.querySelector('.Parent')!
  outer.setAttribute('data-active', '')
  outer.setAttribute('data-strong', '')
  expect({ parent: read('.Parent'), child: read('.Parent > .child') }).toEqual({ parent: '2', child: '8' })
  outer.removeAttribute('data-strong')
  expect({ parent: read('.Parent'), child: read('.Parent > .child') }).toEqual({ parent: '4', child: '16' })
})

// 旧颜色模型让祖先修改按 CSS 继承；只有显式 declare 建立新的基础与规则归属。
test('显式后代声明隔离祖先规则，并从自己的基础继续修改', () => {
  const n = amount('explicit-descendant-boundary')
  const active = condition('&[data-active]')
  const nested = condition('& .nested-child')
  mount(compileRules([
    [[parent], ...declare(n)],
    [[parent, child], ...modify(n, amountModification({ operator: '+', amount: 3 }))],
    [[parent, child, active], ...modify(n, amountModification({ operator: '*', amount: 2 }))],
    [[parent, child, nested], ...declare(n, 5)],
    [[parent, child, nested], ...modify(n, amountModification({ operator: '+', amount: 1 }))],
    [[parent, child], 'z-index', n], [[parent, child, nested], 'z-index', n],
  ]))
  document.querySelector('.Parent > .child')!.setAttribute('data-active', '')
  expect({ outer: read('.Parent > .child'), inner: read('.nested-child') }).toEqual({ outer: '8', inner: '6' })
})

test.each(['<number>', '*'])('不继承注册保持子元素初值，当地修改从初值继续，语法=%s', syntax => {
  const n = variable(1, { name: `non-inheriting-${syntax === '*' ? 'any' : 'number'}`,
    registration: { syntax, inherits: false, initialValue: 1 },
  })
  const local = condition('&[data-local]')
  mount(compileRules([
    [[parent], ...declare(n, 10)], [[parent], ...modify(n, amountModification({ operator: '+', amount: 3 }))],
    [[parent, child, local], ...modify(n, amountModification({ operator: '*', amount: 2 }))],
    [[parent], 'z-index', n], [[parent, child], 'z-index', n],
  ]))
  expect({ parent: read('.Parent'), child: read('.Parent > .child') }).toEqual({ parent: '13', child: '1' })
  const element = document.querySelector('.Parent > .child')!
  element.setAttribute('data-local', '')
  expect(read('.Parent > .child')).toBe('2')
  element.removeAttribute('data-local')
  expect(read('.Parent > .child')).toBe('1')
})

test('共享步骤保持选择器优先级，当地规则覆盖继承，空输出不遮住有效规则', () => {
  const active = condition('&[data-active]')
  const local = condition('&[data-local]')
  const empty = condition('&[data-local][data-empty]')
  const n = variable(2, { name: 'shared-selection-contract' })
  const nModification = (change: number | undefined) => modification(currentExpression => change === undefined
      ? createJSSContent(() => undefined)
      : createJSSContent(resolve => `calc(${resolve(currentExpression)} ${change === 3 ? '*' : '+'} ${change})`, [currentExpression]))
  mount(compileRules([
    [[parent], ...declare(n)],
    [[parent, active], ...modify(n, nModification(3), { id: 'shared' })],
    [[parent], ...modify(n, nModification(2), { id: 'shared' })],
    [[parent, child, local], ...modify(n, nModification(2), { id: 'shared' })],
    [[parent, child, empty], ...modify(n, nModification(undefined), { id: 'shared' })],
    [[parent], 'z-index', n], [[parent, child], 'z-index', n],
  ]))
  document.querySelector('.Parent')!.setAttribute('data-active', '')
  expect({ parent: read('.Parent'), child: read('.Parent > .child') }).toEqual({ parent: '6', child: '6' })
  const element = document.querySelector('.Parent > .child')!
  element.setAttribute('data-local', '')
  element.setAttribute('data-empty', '')
  expect({ parent: read('.Parent'), child: read('.Parent > .child') }).toEqual({ parent: '6', child: '4' })
  element.removeAttribute('data-local')
  expect(read('.Parent > .child')).toBe('6')
})

test.each(['late-declare', 'removed-declare'])('普通颜色消费者在局部声明变化后重新确定归属，操作=%s', async operation => {
  const { colorVariableModification, add } = await import('../index')
  const change = variable(colorVariableModification({ lightness: currentExpression => add(currentExpression, 0.1) }), 'consumer-rule')
  const surface = variable('oklch(0.2 0.1 120)', { name: 'consumer-surface' })
  const declaration = declare(surface, 'oklch(0.5 0.1 120)')
  const input: import('../rule').Rules = [
    [[parent], ...declare(change)], [[parent], ...declare(surface)], [[parent], ...modify(surface, change)],
    [[parent, child], 'background-color', surface],
  ]
  if (operation === 'removed-declare') input.unshift([[parent, child], ...declaration])
  input.push([[], 'order', { compileWaveIndex: 2, onCompile(context, controller) {
    const path = { targetConditionPath: [parent, child], stateConditionPath: [] }
    if (operation === 'late-declare') controller.insert({ before: context.node, conditionPath: path }, declaration, { owner: context.node })
    else controller.remove(controller.nodes().find(node => node.content === declaration[1])!)
    controller.setContent(context, 1)
  } }])
  mount(compileRules(input))
  const element = document.querySelector('.Parent > .child')! as HTMLElement
  element.style.setProperty('--consumer-rule', '0.7 c h / alpha')
  const expected = operation === 'late-declare' ? 0.5 : 0.7
  expect(Number(getComputedStyle(element).backgroundColor.split(' ')[0].slice('oklch('.length))).toBeCloseTo(expected, 5)
})


test('不继承且无注册初值时保留普通引用回退，不把默认内容伪装成初值', () => {
  const local = condition('&[data-local]')
  const n = variable(7, { name: 'universal-without-initial',
    registration: { syntax: '*', inherits: false },
  })
  const nModification = (change: { fixed?: number; amount?: number }) => modification(currentExpression => change.fixed === undefined
      ? createJSSContent(resolve => `calc(${resolve(currentExpression)} + ${change.amount})`, [currentExpression])
      : createJSSContent(() => String(change.fixed)))
  mount(compileRules([
    [[parent], ...declare(n, 10)], [[parent], ...modify(n, nModification({ amount: 3 }))],
    [[parent, child, local], ...modify(n, nModification({ fixed: 20 }))],
    [[parent], 'z-index', n], [[parent, child], 'z-index', n],
  ]))
  const element = document.querySelector('.Parent > .child')!
  expect({ parent: read('.Parent'), child: read('.Parent > .child') }).toEqual({ parent: '13', child: '7' })
  element.setAttribute('data-local', '')
  expect(read('.Parent > .child')).toBe('20')
  element.removeAttribute('data-local')
  expect(read('.Parent > .child')).toBe('7')
})
