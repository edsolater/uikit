/** 在真实浏览器验证全局源规则、按需依赖、重新挂载与失败边界。 */
import { token } from '../token'
import { key } from '../key'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { cdp, userEvent } from 'vitest/browser'
import type { CDPSession } from '@vitest/browser-playwright'
import { compileCSS, cssRoot as root } from '../css-root'
import { rule, rules, type RulesHandle, type Rules } from '../rule'
import { condition, media } from '../condition'
import { declare } from '../operations/declare'
import { $margin } from '../key-registry'
import { $padding } from '../key-registry'
import {
  animationName,
  animationValue,
} from '../pieces/token-factory/animation'
import { multiply } from '../pieces/functions/calc'
import { cssFunction } from '../css-function'
import { colorMix } from '../pieces/functions/color-mix'
import { contentLayout } from '../pieces/mixins/content'
import { motionDuration } from '../pieces/tokens/motion'
import { lineColor } from '../pieces/tokens/color/colors'
import { stateCondition } from '../state-condition'

const testLarge = stateCondition('&[data-large]')
const testMedia = stateCondition('@media (width > 1px)')
const browserA = stateCondition('&:where([data-a])')
const browserB = stateCondition('&:where([data-b])')

let style: HTMLStyleElement
let element: HTMLDivElement
let handles: RulesHandle[]

beforeEach(() => {
  style = document.createElement('style')
  style.id = 'css-root'
  style.textContent = '.existing { color: red; }'
  document.head.append(style)
  element = document.createElement('div')
  element.className = 'example'
  element.textContent = '样式验证'
  document.body.append(element)
  handles = []
})

afterEach(() => {
  for (const handle of handles) handle.remove()
  element.remove()
  style.remove()
  vi.restoreAllMocks()
})

test('简写与长属性覆盖生效，变量注册与局部定义沿同一次编译', () => {
  const gap = token('4px', {
    name: '--space-example',
    registration: { syntax: '<length>', inherits: true, initialValue: '2px' },
  })
  handles.push(
    rules('.example', [
      [$margin, '6px'],
      declare(key('margin-left'), '10px'),
      [$padding, gap],
    ]),
  )
  handles.push(rule('.example', gap, '20px'))
  const before = style.textContent
  expect(compileCSS()).toContain('padding: var(--space-example);')
  expect(style.textContent).toBe(before)
  root.mount()
  const computed = getComputedStyle(element)
  expect(computed.marginTop).toBe('6px')
  expect(computed.marginLeft).toBe('10px')
  expect(computed.paddingLeft).toBe('20px')
  expect(style.sheet!.cssRules[0].cssText).toContain('.existing')
  expect(
    Array.from(style.sheet!.cssRules).filter((entry) =>
      entry.cssText.startsWith('@property --space-example'),
    ),
  ).toHaveLength(1)
})

test('不同 Token 分支分别匹配，并由浏览器执行嵌套交集', async () => {
  const distance = token('2px', {
    name: 'browser-distance-size',
    address: '.example',
    state: Object.fromEntries([['hover', '4px']]),
  })
  const factor = token(2, {
    name: 'browser-distance-ratio',
    address: '.example',
    state: [[testLarge, 3]],
  })
  handles.push(rule('.example', 'margin-left', multiply(distance, factor)))
  root.mount()
  expect(getComputedStyle(element).marginLeft).toBe('4px')
  element.dataset.large = ''
  expect(getComputedStyle(element).marginLeft).toBe('6px')
  await userEvent.hover(element)
  expect(getComputedStyle(element).marginLeft).toBe('12px')
})

test('同址 Token 分支在浏览器中共同更新复合值', async () => {
  const distance = token('2px', {
    name: 'browser-shared-size',
    address: '.example',
    state: Object.fromEntries([['hover', '4px']]),
  })
  const factor = token(2, {
    name: 'browser-shared-ratio',
    address: '.example',
    state: Object.fromEntries([['hover', 3]]),
  })
  handles.push(rule('.example', 'margin-left', multiply(distance, factor)))
  root.mount()
  expect(getComputedStyle(element).marginLeft).toBe('4px')
  await userEvent.hover(element)
  expect(getComputedStyle(element).marginLeft).toBe('12px')
})

test('同权 hover 与 active 同时匹配时，按定义顺序决定最终值', async () => {
  const button = document.createElement('button')
  button.className = 'subject-order'
  button.textContent = '条件顺序验证'
  document.body.append(button)
  const handle = rule(
    '.subject-order',
    'margin-left',
    token('1px', {
      name: 'browser-ordered-size',
      address: '.subject-order',
      state: Object.fromEntries([
        ['hover', '2px'],
        ['active', '3px'],
      ]),
    }),
  )
  handles.push(handle)
  try {
    root.mount()
    await userEvent.hover(button)
    button.focus()
    await userEvent.keyboard('[Space>]')
    try {
      expect(button.matches(':hover:active')).toBe(true)
      expect(getComputedStyle(button).marginLeft).toBe('3px')
      handle.replace(
        token('1px', {
          name: 'browser-ordered-size',
          address: '.subject-order',
          state: Object.fromEntries([
            ['active', '3px'],
            ['hover', '2px'],
          ]),
        }),
      )
      root.mount()
      expect(getComputedStyle(button).marginLeft).toBe('2px')
    } finally {
      await userEvent.keyboard('[/Space]')
    }
  } finally {
    button.remove()
  }
})

test('Token 比例在浏览器改变混色结果，消费函数只定义一次', async () => {
  const ratio = token(0.8, {
    name: 'surface-ratio',
    address: '.example',
    state: { hover: 0.6 },
  })
  handles.push(
    rule('.example', 'background-color', colorMix(['black', ratio], 'white')),
  )
  root.mount()
  expect(style.textContent!.match(/background-color:/g)).toHaveLength(1)
  expect(
    getComputedStyle(element).getPropertyValue('--surface-ratio').trim(),
  ).toBe('0.8')
  const initial = getComputedStyle(element).backgroundColor
  expect(initial).not.toBe('rgba(0, 0, 0, 0)')
  await userEvent.hover(element)
  expect(
    getComputedStyle(element).getPropertyValue('--surface-ratio').trim(),
  ).toBe('0.6')
  const hovered = getComputedStyle(element).backgroundColor
  expect(hovered).not.toBe(initial)
  element.style.setProperty('--surface-ratio', '0.2')
  expect(getComputedStyle(element).backgroundColor).not.toBe(hovered)
})

test('动画复合值激活帧定义，并继续编译帧内变量', () => {
  const opacity = token(0.7, { name: '--final-opacity' })
  const frames: Rules = [
    [[condition('from')], 'opacity', opacity],
    [[condition('to')], 'opacity', opacity],
  ]
  const name = animationName('motion-appearance', frames)
  handles.push(
    rule(
      '.example',
      'animation',
      animationValue({ name, duration: '1s', playState: 'paused' }),
    ),
  )
  root.mount()
  expect(getComputedStyle(element).animationName).toBe('motion-appearance')
  expect(getComputedStyle(element).opacity).toBe('0.7')
  expect(
    Array.from(style.sheet!.cssRules).some((entry) =>
      entry.cssText.startsWith('@keyframes motion-appearance'),
    ),
  ).toBe(true)
})

test('完整函数定义作为依赖挂载，浏览器执行带媒体条件的函数', () => {
  const body: Rules = [
    [
      undefined,
      'result',
      token('16px', {
        name: 'browser-function-size',
        state: [[testMedia, '20px']],
      }),
    ],
  ]
  const size = cssFunction('--example-size() returns <length>', body)
  handles.push(rule('.example', 'font-size', size()))
  root.mount()
  expect(getComputedStyle(element).fontSize).toBe('20px')
})

test('源 Rule 删除后重新挂载，派生依赖随可达性退出且既有宿主内容保留', () => {
  const temporaryVariable = token('12px', { name: '--temporary-reference' })
  const handle = rule('.example', 'margin-left', temporaryVariable)
  handles.push(handle)
  root.mount()
  expect(getComputedStyle(element).marginLeft).toBe('12px')
  const rules = Array.from(style.sheet!.cssRules)
  root.mount()
  expect(Array.from(style.sheet!.cssRules)).toEqual(rules)
  handle.remove()
  root.mount()
  expect(style.textContent).not.toContain('--temporary-reference')
  expect(style.textContent).toContain('.existing')
})

test('缺少宿主时不触发 Token；编译失败保留之前成功提交的 CSS', () => {
  const active = vi.fn()
  handles.push(
    rule('.example', 'margin-left', token('2px', { onFirstScan: active })),
  )
  style.remove()
  expect(() => root.mount()).toThrow('缺少样式挂载节点')
  expect(active).not.toHaveBeenCalled()
  document.head.append(style)
  root.mount()
  const before = style.textContent
  const beforeRules = Array.from(style.sheet!.cssRules)
  const invalid: Rules = []
  invalid.push([undefined, undefined, invalid])
  handles.push(
    rule('.example', 'color', token('red', { onFirstScan: () => invalid })),
  )
  expect(() => root.mount()).toThrow('递归引用')
  expect(style.textContent).toBe(before)
  expect(Array.from(style.sheet!.cssRules)).toEqual(beforeRules)
  expect(getComputedStyle(element).marginLeft).toBe('2px')
})

test('局部 StateCondition 实际叠加、读取来源当前值并退出恢复', () => {
  handles.push(rule('.example', 'margin-left', '12px'))
  root.mount()
  const before = style.textContent
  const danger = stateCondition('&[data-tone="danger"]')
  const emphasis = stateCondition('&[data-emphasis]')
  const source = token('green', {
    name: 'browser-raw-source',
    address: '.example',
    state: [[danger, 'blue']],
  })
  const color = token('red', {
    name: 'browser-raw-color',
    address: '.example',
    state: [
      [danger, source],
      [emphasis, source],
    ],
  })
  handles.push(rule('.example', 'color', color))
  root.mount()
  expect(style.textContent).not.toBe(before)
  expect(
    Array.from(style.sheet!.cssRules).some((entry) =>
      entry.cssText.includes('--browser-raw-color'),
    ),
  ).toBe(true)
  const committed = style.textContent
  expect(getComputedStyle(element).color).toBe('rgb(255, 0, 0)')
  element.dataset.tone = 'danger'
  expect(getComputedStyle(element).color).toBe('rgb(0, 0, 255)')
  element.dataset.emphasis = ''
  expect(getComputedStyle(element).color).toBe('rgb(0, 0, 255)')
  element.removeAttribute('data-emphasis')
  expect(getComputedStyle(element).color).toBe('rgb(0, 0, 255)')
  element.removeAttribute('data-tone')
  expect(getComputedStyle(element).color).toBe('rgb(255, 0, 0)')
  element.dataset.emphasis = ''
  expect(getComputedStyle(element).color).toBe('rgb(0, 128, 0)')
  element.removeAttribute('data-emphasis')
  expect(getComputedStyle(element).color).toBe('rgb(255, 0, 0)')
  expect(style.textContent).toBe(committed)
  expect(getComputedStyle(element).marginLeft).toBe('12px')
})

test('选择居中布局后内容实际位于容器中心', () => {
  handles.push(rules('.example', [contentLayout({ mode: 'center' })]))
  element.style.width = '200px'
  element.style.height = '100px'
  element.textContent = ''
  const child = element.appendChild(document.createElement('div'))
  child.style.width = '20px'
  child.style.height = '20px'
  root.mount()
  const outer = element.getBoundingClientRect()
  const inner = child.getBoundingClientRect()
  expect(
    Math.abs((inner.left + inner.right) / 2 - (outer.left + outer.right) / 2),
  ).toBeLessThan(1)
  expect(
    Math.abs((inner.top + inner.bottom) / 2 - (outer.top + outer.bottom) / 2),
  ).toBeLessThan(1)
})

test('多个 Token 按各自状态顺序取值，交换计算参数不改变结果', () => {
  const first = token(1, {
    name: 'browser-first-ratio',
    address: '.example',
    state: [
      [browserA, 2],
      [browserB, 5],
    ],
  })
  const second = token(1, {
    name: 'browser-second-ratio',
    address: '.example',
    state: [
      [browserB, 11],
      [browserA, 7],
    ],
  })
  const width = rule(
    '.example',
    'width',
    multiply(multiply(first, second), '1px'),
  )
  handles.push(width)
  root.mount()
  expect(getComputedStyle(element).width).toBe('1px')
  element.dataset.a = ''
  expect(getComputedStyle(element).width).toBe('14px')
  element.dataset.b = ''
  expect(getComputedStyle(element).width).toBe('35px')
  width.replace(multiply(multiply(second, first), '1px'))
  root.mount()
  expect(getComputedStyle(element).width).toBe('35px')
})

test('不同主体显式局部声明同名变量而互不污染', () => {
  const first = token('11px', {
    name: 'scoped-shared-size',
    address: '.example',
  })
  const second = token('23px', { name: 'scoped-shared-size' })
  const neighbor = document.body.appendChild(document.createElement('div'))
  neighbor.className = 'neighbor'
  handles.push(rule('.example', 'width', first))
  handles.push(rule('.neighbor', 'width', second))
  try {
    root.mount()
    expect(getComputedStyle(element).width).toBe('11px')
    expect(getComputedStyle(neighbor).width).toBe('23px')
  } finally {
    neighbor.remove()
  }
})

test('交错条件块不能提前合并，否则会改变简写与详细属性的覆盖', () => {
  handles.push(rule(['.example', '&:where([data-a])'], 'margin', '1px'))
  handles.push(rule('.example', 'margin-left', '10px'))
  handles.push(rule(['.example', '&:where([data-a])'], 'margin-top', '3px'))
  element.dataset.a = ''
  root.mount()
  expect(getComputedStyle(element).marginLeft).toBe('10px')
  expect(getComputedStyle(element).marginTop).toBe('3px')
})

test('原生同名声明默认组合，浏览器忽略无效的组合值', () => {
  handles.push(
    rules('.example', [
      [key('margin-left'), '7px'],
      [key('margin-left'), '不是合法长度'],
    ]),
  )
  root.mount()
  expect(style.textContent).toContain('margin-left: 7px, 不是合法长度;')
  expect(getComputedStyle(element).marginLeft).toBe('0px')
})

test('同名函数的完整依赖由后一个定义接管，不残留旧局部变量', () => {
  const oldBody: Rules = [
    [undefined, '--old', '100px'],
    [undefined, 'result', 'var(--old)'],
  ]
  const nextBody: Rules = [[undefined, 'result', 'var(--old, 24px)']]
  handles.push(
    rule(
      '.example',
      'margin-left',
      cssFunction('--replace-test() returns <length>', oldBody)(),
    ),
  )
  handles.push(
    rule(
      '.example',
      'margin-right',
      cssFunction('--replace-test() returns <length>', nextBody)(),
    ),
  )
  root.mount()
  expect(getComputedStyle(element).marginLeft).toBe('24px')
  expect(getComputedStyle(element).marginRight).toBe('24px')
  expect(style.textContent).not.toContain('--old:')
})

test('主题与减少动效变化后，同一份 CSS 给出对应的计算值', async () => {
  const session = (await cdp()) as CDPSession
  const size = token('4px', {
    name: 'environment-size',
    onFirstScan: (): Rules => [
      [[condition(':where(:root)')], size, '8px'],
      [
        [condition(':where(:root)'), condition('&:where([data-theme="dark"])')],
        size,
        '12px',
      ],
      [
        [
          condition(':where(:root)'),
          media('(prefers-reduced-motion: reduce)'),
          condition('&'),
        ],
        size,
        '0px',
      ],
    ],
  })
  handles.push(rule('.example', 'width', size))
  try {
    await session.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    })
    root.mount()
    const committed = style.textContent
    expect(getComputedStyle(element).width).toBe('8px')
    document.documentElement.dataset.theme = 'dark'
    expect(getComputedStyle(element).width).toBe('12px')
    await session.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })
    expect(getComputedStyle(element).width).toBe('0px')
    document.documentElement.removeAttribute('data-theme')
    expect(getComputedStyle(element).width).toBe('0px')
    await session.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    })
    expect(getComputedStyle(element).width).toBe('8px')
    expect(style.textContent).toBe(committed)
  } finally {
    document.documentElement.removeAttribute('data-theme')
    await session.send('Emulation.setEmulatedMedia', { features: [] })
  }
})

test('动效消费统一基准的当前值，分隔线按本地文字变量实时派生', async () => {
  const session = (await cdp()) as CDPSession
  const lineBase = token('blue', {
    name: 'mounted-line-base',
    address: '.example',
  })
  const line = lineColor(lineBase)
  element.style.transitionProperty = 'opacity'
  handles.push(
    rule('.example', 'transition-duration', multiply(motionDuration, 2 / 3)),
  )
  handles.push(rules('.example', [[key('border-color'), line]]))
  try {
    await session.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    })
    root.mount()
    const committed = style.textContent
    const originalLine = getComputedStyle(element).borderTopColor
    expect(getComputedStyle(element).transitionDuration).toBe('0.12s')
    element.style.setProperty(
      `--${motionDuration.name!.replace(/^--/, '')}`,
      '360ms',
    )
    element.style.setProperty('--mounted-line-base', 'red')
    expect(getComputedStyle(element).transitionDuration).toBe('0.24s')
    element.style.removeProperty(`--${motionDuration.name!.replace(/^--/, '')}`)
    expect(getComputedStyle(element).borderTopColor).not.toBe(originalLine)
    await session.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })
    expect(getComputedStyle(element).transitionDuration).toBe('0s')
    expect(style.textContent).toBe(committed)
  } finally {
    await session.send('Emulation.setEmulatedMedia', { features: [] })
  }
})
