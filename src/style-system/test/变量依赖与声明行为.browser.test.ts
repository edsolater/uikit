/** 来源：用户要求 base 是本次声明基础，derive 保留原始状态规则；浏览器仅检验一次编译的静态 CSS。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { compileRules } from '../css-root'
import { declare } from '../operations/declare'
import { add, multiply } from '../pieces/contents/functions/calc'
import { variable } from '../variable'
import { modify } from '../operations/modify'
import { key, type JSSKey } from '../key'
import { value, type ValueInput } from '../value'
import * as variables from '../variable'
import { colorMix } from '../pieces/contents/functions/color-mix'

afterEach(() => document.body.replaceChildren())

/**
 * 将本例的一次编译 CSS 与明确选择器元素挂到浏览器，断言仍由各场景直接表达。
 */
function mountCSS(css: string, className: string, tag = 'div'): HTMLElement {
  document.body.appendChild(document.createElement('style')).textContent = css
  const element = document.body.appendChild(document.createElement(tag))
  element.className = className
  return element
}

test('普通Key两次声明保留join，同名对象仅发布自己的状态', () => {
  const source = variable('10px', { name: 'joined-key-state', states: { '&[data-phase]': base => multiply(base, 2) } })
  const target = key('--joined-key-state', { join: values => values.reduce<ValueInput>((total, item) => add(total, item), '0px') })
  const lower = variable('100px', { name: source.name, priority: 998, states: { '&[data-phase]': '100px' } })
  const css = compileRules([
    [['.Parent'], 'width', source],
    [['.Child'], ...declare(target, '3px')], [['.Child'], ...declare(target, '4px')],
    [['.Child'], ...declare(lower)], [['.Child'], 'width', 'var(--joined-key-state)'],
  ])
  const element = mountCSS(css, 'Child')
  expect(getComputedStyle(element).width).toBe('7px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('100px')
})

test('低等级后写声明不把高等级基础移到零附加权重状态之后', async () => {
  const high = variable('red', { name: 'priority-state-anchor', priority: 6, states: { hover: 'gold' } })
  const low = variable('blue', { name: high.name, priority: 5 })
  const css = compileRules([
    [['.Probe'], ...declare(high)], [['.Probe'], ...declare(low)],
    [['.Probe'], 'color', 'var(--priority-state-anchor)'],
  ])
  const element = mountCSS(css, 'Probe', 'button')
  expect(getComputedStyle(element).color).toBe('rgb(255, 0, 0)')
  await userEvent.hover(element)
  expect(getComputedStyle(element).color).toBe('rgb(255, 215, 0)')
  await userEvent.unhover(element)
  expect(getComputedStyle(element).color).toBe('rgb(255, 0, 0)')
})

test.each([false])('局部声明重访后状态和修改共用新基础，同名另一实例保留自身值，引用 Name=%s', useName => {
  const source = variable('10px', { name: 'revisited-state-modify', states: { '&[data-phase]': base => multiply(base, 2) } })
  const other = variable('99px', { name: source.name })
  const initial = declare(source, '5px')
  const css = compileRules([
    [['.Probe'], ...initial],
    [['.Probe'], ...modify(source, { type: 'expression', detail: base => add(base, '1px') })],
    [['.Probe'], 'width', useName ? source.name : source],
    [['.Other'], ...declare(other)], [['.Other'], 'width', `var(${other.toCSSString()})`],
    [[], undefined, { onCompile(_context, controller) {
      let updated = false
      controller.addSettlementCheck(() => {
        if (updated) return false
        updated = true
        const node = controller.search({ key: source.key }).find(node => node.content === initial[1])!
        node.content = declare(source, '7px')[1]
        node.compileRevision++
        return true
      })
    } }],
  ])
  const element = mountCSS(css, 'Probe')
  const sibling = document.body.appendChild(document.createElement('div'))
  sibling.className = 'Other'
  expect(getComputedStyle(element).width).toBe('8px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('15px')
  expect(getComputedStyle(sibling).width).toBe('99px')
})

test.each([false])('自动来源状态同样触发已消费依赖，子元素原生引用得到当地14px，引用 Name=%s', useName => {
  const source = variable('5px', { name: 'automatic-state-source', states: { '&[data-phase]': '7px' } })
  const line = variable(multiply(useName ? source.name : source, 2), { name: 'automatic-state-line', priority: 2 })
  const css = compileRules([
    [['.Parent'], 'width', useName ? line.name : line],
    [['.Child'], 'height', useName ? source.name : source], [['.Child'], 'width', 'var(--automatic-state-line)'],
  ])
  const parent = mountCSS(css, 'Parent')
  const child = parent.appendChild(document.createElement('div'))
  child.className = 'Child'
  expect(getComputedStyle(child).width).toBe('10px')
  child.dataset.phase = ''
  expect(getComputedStyle(child).width).toBe('14px')
  delete child.dataset.phase
  expect(getComputedStyle(child).width).toBe('10px')
})

test.each(['Variable', 'Key'])('同名%s declare 后，不借用另一对象状态，保持当地7px', (entry) => {
  const source = variable('10px', { name: 'shared-state-size', priority: 0,
    states: { '&[data-phase]': base => multiply(base, 2) },
  })
  const local = entry === 'Key' ? key('--shared-state-size') : variable('1px', { name: 'shared-state-size', priority: 1 })
  const css = compileRules([
    [['.Parent'], 'width', source], [['.Child'], ...declare(local, '7px')],
    [['.Child'], 'width', 'var(--shared-state-size)'],
  ])
  const element = mountCSS(css, 'Child')
  expect(getComputedStyle(element).width).toBe('7px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('7px')
  delete element.dataset.phase
  expect(getComputedStyle(element).width).toBe('7px')
})

test('只 declare 也展开自身 states，局部7px基础在状态下得到14px而非创建默认20px', () => {
  const size = variable('10px', {
    name: 'base-local-size', priority: 0,
    states: { '&[data-phase]': base => multiply(base, 2) },
  })
  const css = compileRules([
    [['.Local'], ...declare(size, '7px')],
    // 原生引用不激活 Variable 依赖消费，状态必须由 declare 自己提供。
    [['.Local'], 'width', 'var(--base-local-size)'],
  ])
  const element = mountCSS(css, 'Local')
  expect(getComputedStyle(element).width).toBe('7px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('14px')
  delete element.dataset.phase
  expect(getComputedStyle(element).width).toBe('7px')
  expect(css).not.toContain('--base-local-size: var(--base-local-size);')
})

test('derive-only 继承名称和默认内容，保留原始状态规则', () => {
  const source = variable('10px', {
    name: 'base-inherited-size', priority: 0,
    states: { '&[data-phase]': base => multiply(base, 2) },
  })
  const inherited = source.derive()
  expect(inherited.name).toBe(source.name)
  const css = compileRules([
    [['.Inherited'], ...declare(inherited)],
    [['.Inherited'], 'width', 'var(--base-inherited-size)'],
  ])
  const element = mountCSS(css, 'Inherited')
  expect(getComputedStyle(element).width).toBe('10px')
  element.dataset.phase = ''
  expect(getComputedStyle(element).width).toBe('20px')
})

test('derive的新默认20px重绑继承规则，覆盖一个状态仍保留另一个，局部declare再次重绑', () => {
  const source = variable('10px', {
    name: 'base-original-size', priority: 0,
    states: {
      '&[data-phase]': base => multiply(base, 2),
      '&[data-other]': base => multiply(base, 3),
    },
  })
  const larger = source.derive('20px', { states: { '&[data-other]': '50px' } })
  const css = compileRules([
    [['.Larger'], ...declare(larger)],
    [['.Larger'], 'width', larger],
    [['.LocalLarger'], ...declare(larger, '7px')],
    [['.LocalLarger'], 'width', `var(${larger.toCSSString()})`],
    [['.Source'], 'width', source],
  ])
  const inherited = mountCSS(css, 'Larger')
  const local = document.body.appendChild(document.createElement('div'))
  local.className = 'LocalLarger'
  expect(getComputedStyle(inherited).width).toBe('20px')
  expect(getComputedStyle(local).width).toBe('7px')
  inherited.dataset.phase = ''
  local.dataset.phase = ''
  expect(getComputedStyle(inherited).width).toBe('40px')
  expect(getComputedStyle(local).width).toBe('14px')
  inherited.dataset.other = ''
  expect(getComputedStyle(inherited).width).toBe('50px')
  delete inherited.dataset.other
  expect(getComputedStyle(inherited).width).toBe('40px')
})

test('Value 生产函数求得的 Variable依赖在子元素重新派生', () => {
  const source = variable('3px', 'browser-produced-source')
  const derived = variable(multiply(value(() => source), 2), { name: 'browser-produced-derived' })
  const css = compileRules([
    [['.ProducedParent'], ...declare(source, '3px')],
    [['.ProducedParent'], 'width', derived],
    [['.ProducedChild'], ...declare(source, '7px')],
    [['.ProducedChild'], 'width', 'var(--browser-produced-derived)'],
  ])
  expect(css).toMatch(/\.ProducedChild\s*\{[^}]*--browser-produced-derived: calc\(var\(--browser-produced-source\) \* 2\);/)
  const parent = mountCSS(css, 'ProducedParent')
  const child = parent.appendChild(document.createElement('div'))
  child.className = 'ProducedChild'
  expect(getComputedStyle(parent).width).toBe('6px')
  expect(getComputedStyle(child).width).toBe('14px')
})

test('生产函数隐藏的Variable 在实际消费位置建立关系，跟随外部局部覆盖', () => {
  const source = variable('3px', { name: 'expanded-local-source' })
  const derived = variable(multiply(value(() => source), 2), { name: 'expanded-local-derived' })
  const css = compileRules([[['.LocalConsumer'], 'width', derived]])
  expect(css).toMatch(/\.LocalConsumer\s*\{[^}]*--expanded-local-derived: calc\(var\(--expanded-local-source\) \* 2\);/)
  const element = mountCSS(css, 'LocalConsumer')
  element.style.setProperty('--expanded-local-source', '7px')
  expect(getComputedStyle(element).width).toBe('14px')
})

test('联动状态在当地展开出另一Variable 后，后代仍沿实际条件边重算', () => {
  const first = variable('3px', 'expanded-state-cascade-first')
  const second = variable('5px', 'expanded-state-cascade-second')
  const derived = variable(() => ({ onCompile(context, controller) {
    controller.setContent(context, context.conditionPath.targetConditionPath.some(item => item.header === '.CascadeParent') ? 1 : 2)
  } }), { name: 'expanded-state-cascade-derived', states: { '&[data-live]': base => multiply(base === 1 ? first : second, 2) } })
  const css = compileRules([
    [['.CascadeParent'], ...declare(first, '3px')], [['.CascadeParent'], ...declare(second, '5px')], [['.CascadeParent'], 'width', derived],
    [['.CascadeChild'], ...declare(first, '7px')], [['.CascadeChild'], 'width', 'var(--expanded-state-cascade-derived)'],
    [['.CascadeGrandchild'], ...declare(second, '11px')], [['.CascadeGrandchild'], 'width', 'var(--expanded-state-cascade-derived)'],
  ])
  const parent = mountCSS(css, 'CascadeParent')
  const child = parent.appendChild(document.createElement('div'))
  child.className = 'CascadeChild'
  const grandchild = child.appendChild(document.createElement('div'))
  grandchild.className = 'CascadeGrandchild'
  for (const element of [parent, child, grandchild]) element.dataset.live = ''
  expect(getComputedStyle(parent).width).toBe('6px')
  expect(getComputedStyle(child).width).toBe('10px')
  expect(getComputedStyle(grandchild).width).toBe('22px')
})
