/** 完整颜色修改规则的浏览器流程验证。

验证普通 Variable 应用完整规则及多个状态同时生效。

规则由 CSS 动态解读，无需交互时重新编译。
*/
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { add, color, modification, cssRoot, declare, key, modify, adjust, multiply, oklch, rules, variable, type RulesHandle } from '../index'
import { colorMix } from '../pieces/contents/functions/color-mix'

const handles: RulesHandle[] = []
afterEach(() => {
  handles.splice(0).forEach(handle => handle.remove())
  document.body.replaceChildren()
})
function mount() {
  const style = document.body.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
}
function element(className: string, parent: HTMLElement = document.body) {
  const result = parent.appendChild(document.createElement('div'))
  result.className = className
  return result
}
const configured = (name: string) => variable('black', { name })

test('完整规则一次设置四通道，再按顺序应用另一完整规则', () => {
  const surface = configured('whole-color')
  const first = modification({ type: 'color', detail: { lightness: 0.4, chroma: 0.1, hue: 120, alpha: 0.8 } })
  const second = modification({ type: 'color', detail: {
    lightness: currentExpression => add(currentExpression, 0.1),
    chroma: currentExpression => add(currentExpression, 0.05),
    hue: currentExpression => add(currentExpression, 30),
    alpha: currentExpression => add(currentExpression, -0.2),
  } })
  handles.push(rules('.Combined', [declare(surface, 'red'), modify(surface, first), modify(surface, second), color({ background: surface })]))
  mount()
  expect(getComputedStyle(element('Combined')).backgroundColor).toBe('oklch(0.5 0.15 150 / 0.6)')
})

test('单一规则变量复用于两个颜色，hover与active同时应用并在退出后恢复', () => {
  const surface = configured('state-color')
  const hoverChange = modification({ name: '--hover-change', type: 'color', detail: {
    lightness: currentExpression => add(currentExpression, 0.05),
    chroma: currentExpression => multiply(currentExpression, 1.1),
  } })
  const activeChange = modification({ name: '--active-change', type: 'color', detail: {
    lightness: currentExpression => add(currentExpression, -0.1),
    chroma: currentExpression => multiply(currentExpression, 0.8), hue: currentExpression => add(currentExpression, 10), alpha: 0.7,
  } })
  handles.push(rules('.First', [declare(surface, 'oklch(.6 .16 260)'), declare(hoverChange), declare(activeChange), color({ background: surface })]))
  handles.push(rules('.Second', [declare(surface, 'oklch(.4 .1 120)'), declare(hoverChange), declare(activeChange), color({ background: surface })]))
  for (const selector of ['.First', '.Second']) {
    handles.push(rules([selector, '&[data-hover]'], modify(surface, hoverChange)))
    handles.push(rules([selector, '&[data-active]'], modify(surface, activeChange)))
  }
  mount()
  const first = element('First'), second = element('Second')
  expect(getComputedStyle(first).backgroundColor).toBe('oklch(0.6 0.16 260)')
  first.dataset.hover = second.dataset.hover = ''
  expect(getComputedStyle(first).backgroundColor).toBe('oklch(0.65 0.176 260)')
  first.dataset.active = second.dataset.active = ''
  expect(getComputedStyle(first).backgroundColor).toBe('oklch(0.55 0.1408 270 / 0.7)')
  expect(getComputedStyle(second).backgroundColor).toBe('oklch(0.35 0.088 130 / 0.7)')
  expect(getComputedStyle(first).getPropertyValue('--hover-change').trim()).toBe('calc(l + 0.05) calc(c * 1.1) h / alpha')
  first.style.setProperty('--hover-change', '0.7 c h / alpha')
  expect(getComputedStyle(first).backgroundColor).toBe('oklch(0.6 0.128 270 / 0.7)')
  first.style.removeProperty('--hover-change')
  delete first.dataset.hover
  expect(getComputedStyle(first).backgroundColor).toBe('oklch(0.5 0.128 270 / 0.7)')
  delete first.dataset.active
  expect(getComputedStyle(first).backgroundColor).toBe('oklch(0.6 0.16 260)')
})

test('另一个普通Variable来源保留完整修改结果', () => {
  const source = configured('source-color'), target = configured('target-color')
  handles.push(rules('.Source', [declare(source, 'red'), modify(source, modification({ type: 'color', detail: { lightness: 0.5, chroma: 0.1, hue: 120 } }))]))
  handles.push(rules(['.Source', '& .Target'], [declare(target, source), modify(target, modification({ type: 'color', detail: { alpha: 0.6 } })), color({ background: target })]))
  mount()
  expect(getComputedStyle(element('Target', element('Source'))).backgroundColor).toBe('oklch(0.5 0.1 120 / 0.6)')
})

test('主题源更新和混色实时生效，规则无需重新编译', () => {
  const source = variable('var(--theme-source)', 'theme-source')
  const target = configured('theme-color')
  handles.push(rules('.Theme', [declare(target, colorMix([source, 0.5], 'white')),
    modify(target, modification({ type: 'color', detail: { alpha: currentExpression => add(currentExpression, -0.1) } })), color({ background: target })]))
  mount()
  const targetElement = element('Theme'), reference = element('Reference')
  reference.style.backgroundColor = 'oklch(from color-mix(in oklab, var(--theme-source) 50%, white) l c h / calc(alpha - .1))'
  for (const theme of ['rgb(255 0 0 / .6)', 'blue']) {
    targetElement.style.setProperty('--theme-source', theme)
    reference.style.setProperty('--theme-source', theme)
    expect(getComputedStyle(targetElement).backgroundColor).toBe(getComputedStyle(reference).backgroundColor)
  }
})

test('基础来源Variable状态进入与退出仍更新最终颜色', async () => {
  const source = variable('red', { name: 'state-source', states: { hover: 'blue' } })
  const target = configured('state-target')
  handles.push(rules('.State', [declare(target, source), modify(target, modification({ type: 'color', detail: { alpha: 0.5 } })), color({ background: target })]))
  mount()
  const targetElement = element('State'), reference = element('Reference')
  targetElement.style.width = targetElement.style.height = '20px'
  reference.style.backgroundColor = 'oklch(from red l c h / .5)'
  expect(getComputedStyle(targetElement).backgroundColor).toBe(getComputedStyle(reference).backgroundColor)
  await userEvent.hover(targetElement)
  reference.style.backgroundColor = 'oklch(from blue l c h / .5)'
  expect(getComputedStyle(targetElement).backgroundColor).toBe(getComputedStyle(reference).backgroundColor)
  await userEvent.unhover(targetElement)
  reference.style.backgroundColor = 'oklch(from red l c h / .5)'
  expect(getComputedStyle(targetElement).backgroundColor).toBe(getComputedStyle(reference).backgroundColor)
})
test('独立变化的条件修改与连续Adjust绑定得到同色，子元素局部覆盖配方生效', () => {
  const base = oklch({ lightness: 0.4, chroma: 0.1, hue: 120, alpha: 0.8 })
  const surface = variable(base, 'dual-surface')
  const hover = modification({ name: '--dual-hover-rule', type: 'color', detail: { lightness: currentExpression => add(currentExpression, 0.1), chroma: currentExpression => multiply(currentExpression, 2) } })
  const active = modification({ type: 'color', detail: { hue: 150, alpha: currentExpression => add(currentExpression, -0.2) } })
  const direct = adjust(adjust(variable(base, 'dual-direct'), hover), active)
  handles.push(rules('.Dual', [declare(surface), declare(hover), [key('background-color'), surface]]))
  handles.push(rules(['.Dual', '&[data-hover]'], modify(surface, hover)))
  handles.push(rules(['.Dual', '&[data-active]'], modify(surface, active)))
  handles.push(rules(['.Dual', '& .Child'], [[key('background-color'), surface]]))
  handles.push(rules('.Direct', [declare(direct), [key('background-color'), direct]]))
  mount()
  const target = element('Dual'), child = element('Child', target), reference = element('Direct')
  expect(getComputedStyle(target).backgroundColor).toBe('oklch(0.4 0.1 120 / 0.8)')
  target.dataset.hover = target.dataset.active = ''
  expect(getComputedStyle(target).backgroundColor).toBe(getComputedStyle(reference).backgroundColor)
  expect(getComputedStyle(child).backgroundColor).toBe(getComputedStyle(reference).backgroundColor)
  child.style.setProperty('--dual-hover-rule', '0.7 c h / alpha')
  expect(getComputedStyle(child).backgroundColor).toBe('oklch(0.7 0.1 150 / 0.6)')
  delete target.dataset.hover
  expect(getComputedStyle(target).backgroundColor).toBe('oklch(0.4 0.1 150 / 0.6)')
  delete target.dataset.active
  expect(getComputedStyle(target).backgroundColor).toBe('oklch(0.4 0.1 120 / 0.8)')
})

test('Adjust共同声明后来源和独立配方的条件覆盖实时改变结果，退出时恢复', () => {
  const source = { key: key('--binding-source'), content: 'oklch(.4 .1 120)' }
  const change = { type: 'color' as const, key: key('--binding-change'), content: 'calc(l + 0.1) c h / alpha' }
  const merged = adjust(source, change)
  handles.push(rules('.Binding', [declare(merged), [key('background-color'), merged]]))
  handles.push(rules(['.Binding', '&[data-source]'], declare(source, 'oklch(.6 .1 120)')))
  handles.push(rules(['.Binding', '&[data-change]'], declare(change, '0.8 c h / alpha')))
  handles.push(rules('.ManualBinding', [declare(merged), declare(source, 'oklch(.6 .2 150)'), declare(change, '0.8 c h / alpha'), [key('background-color'), merged]]))
  mount()
  expect(getComputedStyle(element('ManualBinding')).backgroundColor).toBe('oklch(0.8 0.2 150)')
  const target = element('Binding')
  expect(getComputedStyle(target).backgroundColor).toBe('oklch(0.5 0.1 120)')
  target.dataset.source = ''
  expect(getComputedStyle(target).backgroundColor).toBe('oklch(0.7 0.1 120)')
  target.dataset.change = ''
  expect(getComputedStyle(target).backgroundColor).toBe('oklch(0.8 0.1 120)')
  delete target.dataset.change
  delete target.dataset.source
  expect(getComputedStyle(target).backgroundColor).toBe('oklch(0.5 0.1 120)')
})

test('子元素消费绑定结果在当地重算依赖，同时保留继承的条件Modify与撤销', () => {
  const source = { key: key('--inherited-binding-source'), content: 'oklch(.4 .1 120)' }
  const change = { type: 'color' as const, key: key('--inherited-binding-change'), content: 'calc(l + 0.1) c h / alpha' }
  const merged = adjust(source, change)
  const alpha = modification({ name: '--inherited-binding-alpha', type: 'color', detail: { alpha: 0.6 } })
  handles.push(rules('.BindingParent', [declare(merged), [key('background-color'), merged]]))
  const operation = rules(['.BindingParent', '&[data-alpha]'], modify(merged, alpha))
  handles.push(operation)
  handles.push(rules(['.BindingParent', '& .BindingChild'], [[key('background-color'), merged]]))
  mount()
  const parent = element('BindingParent'), child = element('BindingChild', parent)
  expect(getComputedStyle(parent).backgroundColor).toBe('oklch(0.5 0.1 120)')
  parent.dataset.alpha = ''
  expect(getComputedStyle(child).backgroundColor).toBe('oklch(0.5 0.1 120 / 0.6)')
  child.style.setProperty('--inherited-binding-source', 'oklch(.2 .1 120)')
  expect(getComputedStyle(child).backgroundColor).toBe('oklch(0.3 0.1 120 / 0.6)')
  child.style.setProperty('--inherited-binding-change', '0.7 c h / alpha')
  expect(getComputedStyle(child).backgroundColor).toBe('oklch(0.7 0.1 120 / 0.6)')
  expect(getComputedStyle(parent).backgroundColor).toBe('oklch(0.5 0.1 120 / 0.6)')
  operation.remove()
  cssRoot.mount()
  expect(getComputedStyle(child).backgroundColor).toBe('oklch(0.7 0.1 120)')
  handles.push(rules('.CoveredParent', [declare(merged, 'blue'), [key('background-color'), merged]]))
  handles.push(rules(['.CoveredParent', '& .CoveredChild'], [[key('background-color'), merged]]))
  cssRoot.mount()
  const covered = element('CoveredParent'), coveredChild = element('CoveredChild', covered)
  expect(getComputedStyle(covered).backgroundColor).toBe('rgb(0, 0, 255)')
  expect(getComputedStyle(coveredChild).backgroundColor).toBe('rgb(0, 0, 255)')
  expect(getComputedStyle(covered).getPropertyValue('--inherited-binding-source').trim()).toBe('oklch(.4 .1 120)')
  expect(getComputedStyle(covered).getPropertyValue('--inherited-binding-change').trim()).toBe('calc(l + 0.1) c h / alpha')
})

test('天然来源共同声明后同址Modify进入绑定结果，可调用数值材料也按表达修改', () => {
  const source = Object.create({ key: key('--natural-source'), content: 'oklch(.4 .1 120)' })
  const change = Object.create({ type: 'color', key: key('--natural-alpha'), content: 'l c h / 0.5', description: '透明度' })
  const merged = adjust(source, change)
  const number = Object.assign(() => { throw new Error('信息体不能被调用') }, { key: key('--natural-number'), content: 2 })
  handles.push(rules('.Natural', [declare(merged), modify(source, { type: 'color', key: key('--natural-lightness'), content: 'calc(l + 0.1) c h / alpha' }),
    declare(number), modify(number, { type: 'expression', detail: x => add(x, 3) }), [key('z-index'), 'var(--natural-number)'], [key('background-color'), merged]]))
  mount()
  const target = element('Natural')
  expect(getComputedStyle(target).backgroundColor).toBe('oklch(0.5 0.1 120 / 0.5)')
  expect(getComputedStyle(target).zIndex).toBe('5')
})
