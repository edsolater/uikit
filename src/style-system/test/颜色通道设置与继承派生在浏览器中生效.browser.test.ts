/** 在普通现代浏览器中验证基础色、通道设置和独立增量，无实验标记。 */
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { color, colorVariable, cssRoot, rules, variable, type RulesHandle } from '../index'
import { colorMix } from '../pieces/contents/functions/color-mix'

const handles: RulesHandle[] = []
afterEach(() => {
  handles.splice(0).forEach((handle) => handle.remove())
  document.body.replaceChildren()
})

/** 经统一入口挂载登记样式。 */
function mount() {
  const style = document.body.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
}

/** 创建作用域，供 CSS 自行继承基础色和字段。 */
function element(className: string, parent: HTMLElement = document.body) {
  const result = parent.appendChild(document.createElement('div'))
  result.className = className
  return result
}

test('只声明基础色时保留原色四通道，默认是可增量调整的不透明黑色', () => {
  const surface = colorVariable(undefined, { name: 'browser-base-color' })
  handles.push(rules('.Default', color({ background: surface })))
  handles.push(rules('.Opaque', [surface.declare('rgb(255 0 0 / .6)'), color({ background: surface })]))
  handles.push(rules('.DeltaBlack', [surface.deltaLightness(0.1), surface.deltaAlpha(-0.2), color({ background: surface })]))
  mount()
  expect(getComputedStyle(element('Default')).backgroundColor).toBe('oklch(0 0 0)')
  expect(getComputedStyle(element('Opaque')).backgroundColor).toBe('oklch(0.627966 0.257704 29.2346 / 0.6)')
  expect(getComputedStyle(element('DeltaBlack')).backgroundColor).toBe('oklch(0.1 0 0 / 0.8)')
})

test('绝对设置与四通道增量分别组合，后续 declare 仅替换基础色', () => {
  const surface = colorVariable('black', { name: 'browser-combined-color' })
  handles.push(rules('.Combined', [surface.setLightness(0.4), surface.setChroma(0.1), surface.setHue(120), surface.setAlpha(0.8),
    surface.deltaLightness(0.1), surface.deltaChroma(0.05), surface.deltaHue(30), surface.deltaAlpha(-0.2),
    surface.declare('red'), color({ background: surface })]))
  mount()
  expect(getComputedStyle(element('Combined')).backgroundColor).toBe('oklch(0.5 0.15 150 / 0.6)')
})

test('不同父作用域的子元素按各自基础色重聚合，条件增量最后覆盖并在退出时恢复', () => {
  const surface = colorVariable('black', { name: 'browser-inherited-color' })
  handles.push(rules('.Low', surface.declare('oklch(.2 .1 120)')))
  handles.push(rules('.High', surface.declare('oklch(.6 .1 240)')))
  handles.push(rules('.Child', color({ background: surface })))
  handles.push(rules(['.Child', '&[data-change]'], [surface.deltaLightness(0.3), surface.deltaLightness(0.1)]))
  mount()
  const low = element('Child', element('Low'))
  const high = element('Child', element('High'))
  expect(getComputedStyle(low).backgroundColor).toBe('oklch(0.2 0.1 120)')
  low.dataset.change = high.dataset.change = ''
  expect(getComputedStyle(low).backgroundColor).toBe('oklch(0.3 0.1 120)')
  expect(getComputedStyle(high).backgroundColor).toBe('oklch(0.7 0.1 240)')
  delete low.dataset.change
  expect(getComputedStyle(low).backgroundColor).toBe('oklch(0.2 0.1 120)')
  expect(getComputedStyle(high).backgroundColor).toBe('oklch(0.7 0.1 240)')
})

test.each(['declare', 'set', 'delta'] as const)('同一%s声明复用于两个地址，主色均在消费元素重新发布', (mode) => {
  const surface = colorVariable('black', { name: 'browser-shared-color' })
  handles.push(rules('.FirstParent', surface.declare('oklch(.2 .1 120 / .8)')))
  handles.push(rules('.SecondParent', surface.declare('oklch(.6 .2 240 / .8)')))
  const shared = mode === 'declare' ? surface.declare('oklch(.8 .1 30 / .8)')
    : mode === 'set' ? surface.setLightness(0.8) : surface.deltaLightness(0.1)
  handles.push(rules('.FirstChild', shared), rules('.SecondChild', shared))
  mount()
  const first = element('FirstChild', element('FirstParent'))
  const second = element('SecondChild', element('SecondParent'))
  first.style.backgroundColor = second.style.backgroundColor = 'var(--browser-shared-color)'
  const expected = mode === 'declare' ? ['oklch(0.8 0.1 30 / 0.8)', 'oklch(0.8 0.1 30 / 0.8)']
    : mode === 'set' ? ['oklch(0.8 0.1 120 / 0.8)', 'oklch(0.8 0.2 240 / 0.8)']
    : ['oklch(0.3 0.1 120 / 0.8)', 'oklch(0.7 0.2 240 / 0.8)']
  expect(getComputedStyle(first).backgroundColor).toBe(expected[0])
  expect(getComputedStyle(second).backgroundColor).toBe(expected[1])
})

test('另一个 ColorVariable 来源消费其完整最终色，不丢失来源设置与增量', () => {
  const source = colorVariable('red', { name: 'browser-full-source' })
  const target = colorVariable('black', { name: 'browser-full-target' })
  handles.push(rules('.Source', [source.setLightness(0.4), source.deltaLightness(0.1), source.setChroma(0.1), source.setHue(120)]))
  handles.push(rules('.Target', [target.declare(source), target.setAlpha(0.5), target.deltaAlpha(0.1), color({ background: target })]))
  mount()
  expect(getComputedStyle(element('Target', element('Source'))).backgroundColor).toBe('oklch(0.5 0.1 120 / 0.6)')
})

test('基础色 CSS 主题更新和 JSS 混色实时生效，通道调整保持', () => {
  const source = variable('var(--theme-source)', { name: 'browser-theme-source' })
  const target = colorVariable('black', { name: 'browser-theme-target' })
  handles.push(rules('.Theme', [target.declare(colorMix([source, 0.5], 'white')), target.deltaAlpha(-0.1), color({ background: target })]))
  mount()
  const targetElement = element('Theme')
  const reference = element('Reference')
  reference.style.backgroundColor = 'oklch(from color-mix(in oklab, var(--theme-source) 50%, white) l c h / calc(alpha - .1))'
  for (const theme of ['rgb(255 0 0 / .6)', 'blue']) {
    targetElement.style.setProperty('--theme-source', theme)
    reference.style.setProperty('--theme-source', theme)
    expect(getComputedStyle(targetElement).backgroundColor).toBe(getComputedStyle(reference).backgroundColor)
  }
})

test('来源 Variable 的 hover 状态进入与退出仍更新基础色', async () => {
  const source = variable('red', { name: 'browser-state-source', states: { hover: 'blue' } })
  const target = colorVariable('black', { name: 'browser-state-target' })
  handles.push(rules('.State', [target.declare(source), color({ background: target })]))
  mount()
  const targetElement = element('State')
  targetElement.style.width = targetElement.style.height = '20px'
  const reference = element('Reference')
  reference.style.backgroundColor = 'oklch(from red l c h / alpha)'
  expect(getComputedStyle(targetElement).backgroundColor).toBe(getComputedStyle(reference).backgroundColor)
  await userEvent.hover(targetElement)
  reference.style.backgroundColor = 'oklch(from blue l c h / alpha)'
  expect(getComputedStyle(targetElement).backgroundColor).toBe(getComputedStyle(reference).backgroundColor)
  await userEvent.unhover(targetElement)
  reference.style.backgroundColor = 'oklch(from red l c h / alpha)'
  expect(getComputedStyle(targetElement).backgroundColor).toBe(getComputedStyle(reference).backgroundColor)
})
