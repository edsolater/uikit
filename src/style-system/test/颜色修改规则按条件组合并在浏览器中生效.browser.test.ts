/**
 * 完整颜色修改规则的浏览器流程验证。
 *
 * 验证普通 Token 应用完整规则及多个状态同时生效。
 *
 * 规则由 CSS 动态解读，无需交互时重新编译。
 */
import { token, type TokenAddress } from '../token'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { add, multiply } from '../pieces/functions/calc'
import { color } from '../pieces/mixins/appearance'
import { modification } from '../modification'
import { cssRoot } from '../css-root'
import { declare } from '../operations/declare'
import { key } from '../key'
import { modify } from '../operations/modify'
import { oklch } from '../pieces/functions/oklch'
import { rules, type RulesHandle } from '../rule'
import { colorMix } from '../pieces/functions/color-mix'

const handles: RulesHandle[] = []
afterEach(() => {
  handles.splice(0).forEach((handle) => handle.remove())
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
const configured = (name: string, address: TokenAddress = ':root') =>
  token('black', { name, address })

test('完整规则一次设置四通道，再按顺序应用另一完整规则', () => {
  const surface = configured('whole-color')
  const first = modification({
    type: 'color',
    detail: { lightness: 0.4, chroma: 0.1, hue: 120, alpha: 0.8 },
  })
  const second = modification({
    type: 'color',
    detail: {
      lightness: (currentExpression) => add(currentExpression, 0.1),
      chroma: (currentExpression) => add(currentExpression, 0.05),
      hue: (currentExpression) => add(currentExpression, 30),
      alpha: (currentExpression) => add(currentExpression, -0.2),
    },
  })
  handles.push(
    rules('.Combined', [
      declare(surface, 'red'),
      modify(surface, first),
      modify(surface, second),
      color({ background: surface }),
    ]),
  )
  mount()
  expect(getComputedStyle(element('Combined')).backgroundColor).toBe(
    'oklch(0.5 0.15 150 / 0.6)',
  )
})

test('单一规则变量复用于两个颜色，hover与active同时应用并在退出后恢复', () => {
  const surface = configured('state-color', '.First')
  const hoverChange = modification({
    name: 'hover-change',
    type: 'color',
    detail: {
      lightness: (currentExpression) => add(currentExpression, 0.05),
      chroma: (currentExpression) => multiply(currentExpression, 1.1),
    },
  })
  const activeChange = modification({
    name: 'active-change',
    type: 'color',
    detail: {
      lightness: (currentExpression) => add(currentExpression, -0.1),
      chroma: (currentExpression) => multiply(currentExpression, 0.8),
      hue: (currentExpression) => add(currentExpression, 10),
      alpha: 0.7,
    },
  })
  handles.push(
    rules('.First', [
      declare(surface, 'oklch(.6 .16 260)'),
      color({ background: surface }),
    ]),
  )
  const otherSurface = token('oklch(.4 .1 120)', {
    name: surface.name,
    state: surface.state,
    address: '.Second',
    registration: surface.registration,
  })
  handles.push(rules('.Second', [color({ background: otherSurface })]))
  for (const selector of ['.First', '.Second']) {
    handles.push(
      rules(
        [selector, '&[data-hover]'],
        modify(selector === '.Second' ? otherSurface : surface, hoverChange),
      ),
    )
    handles.push(
      rules(
        [selector, '&[data-active]'],
        modify(selector === '.Second' ? otherSurface : surface, activeChange),
      ),
    )
  }
  mount()
  const first = element('First'),
    second = element('Second')
  expect(getComputedStyle(first).backgroundColor).toBe('oklch(0.6 0.16 260)')
  first.dataset.hover = second.dataset.hover = ''
  expect(getComputedStyle(first).backgroundColor).toBe('oklch(0.65 0.176 260)')
  first.dataset.active = second.dataset.active = ''
  expect(getComputedStyle(first).backgroundColor).toBe(
    'oklch(0.55 0.1408 270 / 0.7)',
  )
  expect(getComputedStyle(second).backgroundColor).toBe(
    'oklch(0.35 0.088 130 / 0.7)',
  )
  expect(
    getComputedStyle(first).getPropertyValue('--hover-change').trim(),
  ).toBe('calc(l + 0.05) calc(c * 1.1) h / alpha')
  first.style.setProperty('--hover-change', '0.7 c h / alpha')
  expect(getComputedStyle(first).backgroundColor).toBe(
    'oklch(0.6 0.128 270 / 0.7)',
  )
  first.style.removeProperty('--hover-change')
  delete first.dataset.hover
  expect(getComputedStyle(first).backgroundColor).toBe(
    'oklch(0.5 0.128 270 / 0.7)',
  )
  delete first.dataset.active
  expect(getComputedStyle(first).backgroundColor).toBe('oklch(0.6 0.16 260)')
})

test('另一个普通Token来源保留完整修改结果', () => {
  const source = configured('source-color', '.Source'),
    target = configured('target-color', ['.Source', '& .Target'])
  handles.push(
    rules('.Source', [
      declare(source, 'red'),
      modify(
        source,
        modification({
          type: 'color',
          detail: { lightness: 0.5, chroma: 0.1, hue: 120 },
        }),
      ),
    ]),
  )
  handles.push(
    rules(
      ['.Source', '& .Target'],
      [
        declare(target, source),
        modify(target, modification({ type: 'color', detail: { alpha: 0.6 } })),
        color({ background: target }),
      ],
    ),
  )
  mount()
  expect(
    getComputedStyle(element('Target', element('Source'))).backgroundColor,
  ).toBe('oklch(0.5 0.1 120 / 0.6)')
})

test('主题源更新和混色实时生效，规则无需重新编译', () => {
  const source = token('var(--theme-source)', 'theme-source')
  const target = configured('theme-color', '.Theme')
  handles.push(
    rules('.Theme', [
      declare(target, colorMix([source, 0.5], 'white')),
      modify(
        target,
        modification({
          type: 'color',
          detail: {
            alpha: (currentExpression) => add(currentExpression, -0.1),
          },
        }),
      ),
      color({ background: target }),
    ]),
  )
  mount()
  const targetElement = element('Theme'),
    reference = element('Reference')
  reference.style.backgroundColor =
    'oklch(from color-mix(in oklab, var(--theme-source) 50%, white) l c h / calc(alpha - .1))'
  for (const theme of ['rgb(255 0 0 / .6)', 'blue']) {
    targetElement.style.setProperty('--theme-source', theme)
    reference.style.setProperty('--theme-source', theme)
    expect(getComputedStyle(targetElement).backgroundColor).toBe(
      getComputedStyle(reference).backgroundColor,
    )
  }
})

test('基础来源Token状态进入与退出仍更新最终颜色', async () => {
  const source = token('red', {
    name: 'state-source',
    address: '.State',
    state: { hover: 'blue' },
  })
  const target = configured('state-target', '.State')
  handles.push(
    rules('.State', [
      declare(target, source),
      modify(target, modification({ type: 'color', detail: { alpha: 0.5 } })),
      color({ background: target }),
    ]),
  )
  mount()
  const targetElement = element('State'),
    reference = element('Reference')
  targetElement.style.width = targetElement.style.height = '20px'
  reference.style.backgroundColor = 'oklch(from red l c h / .5)'
  expect(getComputedStyle(targetElement).backgroundColor).toBe(
    getComputedStyle(reference).backgroundColor,
  )
  await userEvent.hover(targetElement)
  reference.style.backgroundColor = 'oklch(from blue l c h / .5)'
  expect(getComputedStyle(targetElement).backgroundColor).toBe(
    getComputedStyle(reference).backgroundColor,
  )
  await userEvent.unhover(targetElement)
  reference.style.backgroundColor = 'oklch(from red l c h / .5)'
  expect(getComputedStyle(targetElement).backgroundColor).toBe(
    getComputedStyle(reference).backgroundColor,
  )
})
test('独立变化按非交换顺序修改并得到规定颜色，子元素局部覆盖配方生效', () => {
  const base = oklch({ lightness: 0.4, chroma: 0.1, hue: 120, alpha: 0.8 })
  const surface = token(base, { name: 'dual-surface', address: '.Dual' })
  const hover = modification({
    name: 'dual-hover-rule',
    type: 'color',
    detail: {
      lightness: (currentExpression) => add(currentExpression, 0.1),
      chroma: (currentExpression) => multiply(currentExpression, 2),
    },
  })
  const active = modification({
    type: 'color',
    detail: {
      hue: 150,
      alpha: (currentExpression) => add(currentExpression, -0.2),
    },
  })
  const direct = token('oklch(0.5 0.2 150 / 0.6)')
  handles.push(rules('.Dual', [[key('background-color'), surface]]))
  handles.push(rules(['.Dual', '&[data-hover]'], modify(surface, hover)))
  handles.push(rules(['.Dual', '&[data-active]'], modify(surface, active)))
  handles.push(
    rules(['.Dual', '& .Child'], [[key('background-color'), surface]]),
  )
  handles.push(rules('.Direct', [[key('background-color'), direct]]))
  mount()
  const target = element('Dual'),
    child = element('Child', target),
    reference = element('Direct')
  expect(getComputedStyle(target).backgroundColor).toBe(
    'oklch(0.4 0.1 120 / 0.8)',
  )
  target.dataset.hover = target.dataset.active = ''
  expect(getComputedStyle(target).backgroundColor).toBe(
    getComputedStyle(reference).backgroundColor,
  )
  expect(getComputedStyle(child).backgroundColor).toBe(
    getComputedStyle(reference).backgroundColor,
  )
  child.style.setProperty('--dual-hover-rule', '0.7 c h / alpha')
  expect(getComputedStyle(child).backgroundColor).toBe(
    'oklch(0.7 0.1 150 / 0.6)',
  )
  delete target.dataset.hover
  expect(getComputedStyle(target).backgroundColor).toBe(
    'oklch(0.4 0.1 150 / 0.6)',
  )
  delete target.dataset.active
  expect(getComputedStyle(target).backgroundColor).toBe(
    'oklch(0.4 0.1 120 / 0.8)',
  )
})
