/** 完整颜色修改规则的浏览器流程验证。

验证普通 Variable 应用完整规则及多个状态同时生效。

规则由 CSS 动态解读，无需交互时重新编译。
*/
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { add, color, colorModification, cssRoot, declare, key, modify, adjust, multiply, oklch, rules, variable, type RulesHandle } from '../index'
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
  const first = colorModification({ lightness: 0.4, chroma: 0.1, hue: 120, alpha: 0.8 })
  const second = colorModification({
    lightness: currentExpression => add(currentExpression, 0.1),
    chroma: currentExpression => add(currentExpression, 0.05),
    hue: currentExpression => add(currentExpression, 30),
    alpha: currentExpression => add(currentExpression, -0.2),
  })
  handles.push(rules('.Combined', [declare(surface, 'red'), modify(surface, first), modify(surface, second), color({ background: surface })]))
  mount()
  expect(getComputedStyle(element('Combined')).backgroundColor).toBe('oklch(0.5 0.15 150 / 0.6)')
})

test('单一规则变量复用于两个颜色，hover与active同时应用并在退出后恢复', () => {
  const surface = configured('state-color')
  const hoverChange = variable(colorModification({
    lightness: currentExpression => add(currentExpression, 0.05),
    chroma: currentExpression => multiply(currentExpression, 1.1),
  }), 'hover-change')
  const activeChange = variable(colorModification({
    lightness: currentExpression => add(currentExpression, -0.1),
    chroma: currentExpression => multiply(currentExpression, 0.8), hue: currentExpression => add(currentExpression, 10), alpha: 0.7,
  }), 'active-change')
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
  handles.push(rules('.Source', [declare(source, 'red'), modify(source, colorModification({ lightness: 0.5, chroma: 0.1, hue: 120 }))]))
  handles.push(rules(['.Source', '& .Target'], [declare(target, source), modify(target, colorModification({ alpha: 0.6 })), color({ background: target })]))
  mount()
  expect(getComputedStyle(element('Target', element('Source'))).backgroundColor).toBe('oklch(0.5 0.1 120 / 0.6)')
})

test('主题源更新和混色实时生效，规则无需重新编译', () => {
  const source = variable('var(--theme-source)', 'theme-source')
  const target = configured('theme-color')
  handles.push(rules('.Theme', [declare(target, colorMix([source, 0.5], 'white')),
    modify(target, colorModification({ alpha: currentExpression => add(currentExpression, -0.1) })), color({ background: target })]))
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
  handles.push(rules('.State', [declare(target, source), modify(target, colorModification({ alpha: 0.5 })), color({ background: target })]))
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
test('整条规则保存到普通Variable，CSS状态组合与直接JS应用得到同色', () => {
  const base = oklch({ lightness: 0.4, chroma: 0.1, hue: 120, alpha: 0.8 })
  const surface = variable(base, 'dual-surface'), direct = variable(base, 'dual-direct')
  const hover = colorModification({ lightness: currentExpression => add(currentExpression, 0.1), chroma: currentExpression => multiply(currentExpression, 2) })
  const active = colorModification({ hue: 150, alpha: currentExpression => add(currentExpression, -0.2) })
  const hoverRule = variable(hover, 'dual-hover-rule')
  adjust('mutable', direct, hover)
  adjust('mutable', direct, active)
  handles.push(rules('.Dual', [declare(surface), declare(hoverRule), [key('background-color'), surface]]))
  handles.push(rules(['.Dual', '&[data-hover]'], modify(surface, hoverRule)))
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
