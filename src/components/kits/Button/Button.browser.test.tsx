import { flush } from 'solid-js'
import {
  buttonTextSize,
  buttonMinHeight,
  buttonGap,
  buttonPaddingBlock,
} from '@/index'
import {
  buttonSurfaceColor,
  buttonContentColor,
  buttonColorSource,
} from './Button.style'
/** 验证真实 Button 分类、交互状态与局部样式覆盖的浏览器行为。 */
import {
  declare,
  modify,
  token,
  cssRoot,
  rule,
  rules,
  type RulesHandle,
  whenHover,
  whenActive,
  whenDisabled,
  $borderRadius,
  $backgroundColor,
  contentLayout,
  baseRadius,
  baseSpace,
  multiply,
  badColor,
  oklch,
  baseShadow,
  baseShadowSmall,
  controlSize,
  textSize,
  baseOpacity,
} from '@/style-system'
import '../../../css/all-base.css'
import { render } from '@solidjs/web'
import { afterEach, describe, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createState } from '@/foundation'
import { Button, type ButtonProps, type ButtonAppearance } from './Button'
import { Piv } from '@/components/Piv/Piv'
import { buttonMapping } from './Button.mapping'

import './Button.style'
import * as globalColors from '@/style-system/pieces/tokens/color/colors'
import { brandColor } from '@/style-system/pieces/tokens/color/brand-color'
import {
  inkColor,
  paperColor,
} from '@/style-system/pieces/tokens/color/palette'
import '../../../components/kits/Input/Input.css'
import '../../../components/kits/Popover/popover.css'

let dispose: (() => void) | undefined
const handles: RulesHandle[] = []
const buttonStyleSelector = 'style#css-root'

/** 模拟应用在渲染前提供挂载点并提交已登记样式。 */
function mountButtonStyles() {
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  return style
}

/** 读取主体外观；焦点轮廓在用例中单独比较。 */
function appearance(button: HTMLElement) {
  const style = getComputedStyle(button)
  return Object.fromEntries(
    [
      'background-color',
      'color',
      'border-top-color',
      'box-shadow',
      'opacity',
      'transform',
    ].map((key) => [key, style.getPropertyValue(key)]),
  )
}

/** 用浏览器转换到同一色空间再比较数值，容许 CSS 序列化的末位舍入。 */
function expectSameColor(
  actual: string,
  expected: string,
  tolerance = 0.00005,
) {
  const numbers = (content: string) => {
    const probe = document.body.appendChild(document.createElement('div'))
    probe.style.color = `color(from ${content} srgb r g b / alpha)`
    const result = getComputedStyle(probe)
      .color.match(/[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi)!
      .map(Number)
    probe.remove()
    if (result.length === 3) result.push(1)
    return result
  }
  const actualNumbers = numbers(actual)
  const expectedNumbers = numbers(expected)
  expect(actualNumbers).toHaveLength(expectedNumbers.length)
  actualNumbers.forEach((amount, index) =>
    expect(Math.abs(amount - expectedNumbers[index])).toBeLessThanOrEqual(
      tolerance,
    ),
  )
}

/** 读取感知色空间的色度，比较声量而不冻结旧混色数值。 */
function chroma(content: string): number {
  const probe = document.body.appendChild(document.createElement('div'))
  probe.style.color = `oklch(from ${content} l c h / alpha)`
  const color = getComputedStyle(probe).color
  probe.remove()
  return Number(color.match(/oklch\(\S+\s+(\S+)/)![1])
}

/** 颜色比较保留视觉等价断言，其他外观仍严格逐项一致。 */
function expectSameAppearance(
  actual: Record<string, string>,
  expected: Record<string, string>,
) {
  for (const name of Object.keys(actual)) {
    if (name.endsWith('color')) expectSameColor(actual[name], expected[name])
    else expect(actual[name], name).toBe(expected[name])
  }
}

/** 背景与内容色分别比较，避免混色空间标签导致同色误判。 */
function expectSameColors(actual: string[], expected: string[]) {
  actual.forEach((content, index) => expectSameColor(content, expected[index]))
}

afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  document.head
    .querySelectorAll(buttonStyleSelector)
    .forEach((element) => element.remove())
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.style.removeProperty('--base-brand')
})

describe('Button styles', () => {
  test('原生表单中默认不提交，外部type列表来源接管提交重置与禁用', () => {
    mountButtonStyles()
    const host = document.body.appendChild(document.createElement('main'))
    const disabled = createState(false)
    const type = createState<'submit' | 'reset'>('submit')
    let clicks = 0
    let submissions = 0
    let resets = 0
    dispose = render(
      () => (
        <Piv
          as="form"
          on={{
            submit: {
              passive: false,
              callback: ({ event }) => {
                event.preventDefault()
                submissions++
              },
            },
            reset: {
              passive: false,
              callback: ({ event }) => {
                event.preventDefault()
                resets++
              },
            },
          }}
        >
          <Button
            onClick={() => {
              clicks++
            }}
          >
            普通
          </Button>
          <Button disabled={disabled} htmlProps={[{ type: 'reset' }, { type }]}>
            提交或重置
          </Button>
        </Piv>
      ),
      host,
    )
    const [ordinary, submit] = host.querySelectorAll('button')
    expect(ordinary.type).toBe('button')
    expect(submit.type).toBe('submit')
    ordinary.click()
    expect(clicks).toBe(1)
    expect(submissions).toBe(0)
    submit.click()
    expect(submissions).toBe(1)
    disabled.set(true)
    flush()
    submit.click()
    expect(submissions).toBe(1)
    disabled.set(false)
    type.set('reset')
    flush()
    expect(submit.type).toBe('reset')
    submit.click()
    expect(resets).toBe(1)
    expect(submissions).toBe(1)
  })

  test.each([false, true])(
    'filled 普通语气保留明度反馈，危险材料遵循层叠，交互退出恢复：strong=%s',
    async (strong) => {
      document.documentElement.dataset.theme = 'light'
      mountButtonStyles()
      const host = document.body.appendChild(document.createElement('div'))
      dispose = render(
        () => (
          <>
            <Button filled strong={strong}>
              确认
            </Button>
            <Button filled danger strong={strong}>
              删除
            </Button>
          </>
        ),
        host,
      )
      // 明度变化下限是视觉验收选择；拒绝只有文本、色度或阴影变化而明度互相抵消。
      const lightness = (content: string) => {
        const probe = document.body.appendChild(document.createElement('div'))
        probe.style.color = `oklch(from ${content} l c h / alpha)`
        const result = Number(
          getComputedStyle(probe).color.match(/oklch\((\S+)/)![1],
        )
        probe.remove()
        return result
      }
      for (const button of host.querySelectorAll<HTMLButtonElement>('button')) {
        const danger = button.dataset.tone === 'danger'
        button.style.transition = 'none'
        await userEvent.unhover(button)
        const normal = appearance(button)
        await userEvent.hover(button)
        const hover = appearance(button)
        if (danger)
          expectSameColor(hover['background-color'], normal['background-color'])
        else {
          expect(normal['background-color']).not.toBe(hover['background-color'])
          expect(
            Math.abs(
              lightness(normal['background-color']) -
                lightness(hover['background-color']),
            ),
          ).toBeGreaterThan(0.015)
        }
        button.focus()
        await userEvent.keyboard('[Space>]')
        try {
          expect(button.matches(':hover:active')).toBe(true)
          if (danger)
            expectSameColor(
              appearance(button)['background-color'],
              normal['background-color'],
            )
          else
            expect(
              Math.abs(
                lightness(hover['background-color']) -
                  lightness(appearance(button)['background-color']),
              ),
            ).toBeGreaterThan(0.015)
          expect(appearance(button).transform).not.toBe('none')
        } finally {
          await userEvent.keyboard('[/Space]')
        }
        expectSameAppearance(appearance(button), hover)
        await userEvent.unhover(button)
        button.blur()
        expectSameAppearance(appearance(button), normal)
        button.disabled = true
        await userEvent.hover(button)
        expectSameColors(
          [
            getComputedStyle(button).backgroundColor,
            getComputedStyle(button).color,
          ],
          [hover['background-color'], hover.color],
        )
        expect(Number(getComputedStyle(button).opacity)).toBeCloseTo(
          (Number(normal.opacity) * 0.48) / 0.9,
          5,
        )
        await userEvent.unhover(button)
        button.disabled = false
        expectSameAppearance(appearance(button), normal)
      }
    },
  )

  test.each(['filled', 'outlined', 'plain'] as const)(
    '真实%s按钮的强调作用于文字和纯图形，保留外观、尺寸与禁用行为',
    async (selectedAppearance) => {
      mountButtonStyles()
      const host = document.body.appendChild(document.createElement('div'))
      const emphasis = createState<'soft' | 'strong' | undefined>()
      const disabled = createState(false)
      dispose = render(
        () => (
          <>
            <Button
              appearance={selectedAppearance}
              emphasis={emphasis}
              disabled={disabled}
              danger
            >
              动作
            </Button>
            <Button
              appearance={selectedAppearance}
              emphasis={emphasis}
              disabled={disabled}
              danger
              name="添加"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M2 10H18M10 2V18" stroke="black" stroke-width="2" />
              </svg>
            </Button>
          </>
        ),
        host,
      )
      const buttons = Array.from(
        host.querySelectorAll<HTMLButtonElement>('button'),
      )
      for (const button of buttons) button.style.transition = 'none'
      const normal = buttons.map(appearance)
      const bounds = buttons.map((button) => [
        button.getBoundingClientRect().width,
        button.getBoundingClientRect().height,
      ])
      emphasis.set('strong')
      flush()
      buttons.forEach((button, index) => {
        expect(Number(getComputedStyle(button).opacity)).toBeGreaterThan(
          Number(normal[index].opacity),
        )
        expect([
          button.getBoundingClientRect().width,
          button.getBoundingClientRect().height,
        ]).toEqual(bounds[index])
        expect(button.dataset.appearance).toBe(selectedAppearance)
        expect(button.dataset.tone).toBe('danger')
        if (selectedAppearance === 'plain') {
          expectSameColor(
            getComputedStyle(button).backgroundColor,
            'transparent',
          )
          expectSameColor(
            getComputedStyle(button).borderTopColor,
            'transparent',
          )
        }
      })
      emphasis.set('soft')
      flush()
      buttons.forEach((button, index) => {
        expect(Number(getComputedStyle(button).opacity)).toBeLessThan(
          Number(normal[index].opacity),
        )
        expect([
          button.getBoundingClientRect().width,
          button.getBoundingClientRect().height,
        ]).toEqual(bounds[index])
      })
      for (const selected of ['soft', undefined, 'strong'] as const) {
        emphasis.set(selected)
        flush()
        disabled.set(true)
        flush()
        for (const button of buttons) {
          await userEvent.hover(button)
          expect(Number(getComputedStyle(button).opacity)).toBeCloseTo(
            ((selected === 'soft' ? 0.7 : selected === 'strong' ? 1 : 0.9) *
              0.48) /
              0.9,
            5,
          )
          expect(getComputedStyle(button).transform).toBe('none')
          await userEvent.unhover(button)
        }
        disabled.set(false)
        flush()
      }
      emphasis.set(undefined)
      flush()
      buttons.forEach((button, index) =>
        expectSameAppearance(appearance(button), normal[index]),
      )
    },
  )

  test('真实按钮的填充、轮廓、无边界与语气生效，动态外观退出后恢复', () => {
    mountButtonStyles()
    const host = document.body.appendChild(document.createElement('div'))
    const selectedAppearance = createState<ButtonAppearance | undefined>(
      'filled',
    )
    dispose = render(
      () => (
        <>
          <Button>普通</Button>
          <Button filled>填充</Button>
          <Button plain>无边界</Button>
          <Button danger filled>
            危险填充
          </Button>
          <Button appearance={selectedAppearance}>动态</Button>
        </>
      ),
      host,
    )
    const [outlined, filled, plain, danger, dynamic] =
      host.querySelectorAll<HTMLButtonElement>('button')
    for (const button of [outlined, filled, plain, danger, dynamic])
      button.style.transition = 'none'
    const read = (button: HTMLElement) => getComputedStyle(button)
    expect(read(filled).backgroundColor).not.toBe(
      read(outlined).backgroundColor,
    )
    expect(read(filled).color).not.toBe(read(outlined).color)
    expectSameColor(read(plain).backgroundColor, 'transparent')
    expect(read(outlined).borderTopWidth).not.toBe('0px')
    expectSameColor(read(plain).borderTopColor, 'transparent')
    expect(read(outlined).borderTopColor).not.toBe(read(plain).borderTopColor)
    expect(read(danger).backgroundColor).not.toBe(read(filled).backgroundColor)
    expectSameAppearance(appearance(dynamic), appearance(filled))
    selectedAppearance.set('plain')
    flush()
    expectSameAppearance(appearance(dynamic), appearance(plain))
    selectedAppearance.set(undefined)
    flush()
    expectSameAppearance(appearance(dynamic), appearance(outlined))
  })

  test('普通按钮沿用区域内容色，嵌套语气内容色不改变其默认来源', async () => {
    // 显式选择内容入口；不通过局部墨色触发祖先公式重新绑定。
    handles.push(
      rules(
        ['@layer uikit', '.Button'],
        [declare(globalColors.contentColor, 'inherit')],
      ),
    )
    const parent = document.body.appendChild(document.createElement('div'))
    parent.className = 'Button'
    parent.dataset.tone = 'danger'
    parent.style.setProperty(
      `--${globalColors.contentColor.name!.replace(/^--/, '')}`,
      'rgb(78, 90, 123)',
    )
    dispose = render(() => <Button>普通按钮</Button>, parent)
    const button = parent.querySelector<HTMLButtonElement>('button')!
    button.style.transition = 'none'
    mountButtonStyles()
    expectSameColor(getComputedStyle(button).color, 'rgb(78, 90, 123)')
    await userEvent.hover(button)
    expectSameColor(getComputedStyle(button).color, 'rgb(78, 90, 123)')
    button.style.setProperty(
      `--${globalColors.contentColor.name!.replace(/^--/, '')}`,
      'rgb(123, 90, 78)',
    )
    button.focus()
    await userEvent.keyboard('[Space>]')
    try {
      expect(button.matches(':active')).toBe(true)
      expectSameColor(getComputedStyle(button).color, 'rgb(123, 90, 78)')
    } finally {
      await userEvent.keyboard('[/Space]')
    }
  })

  test('新组件描述外观、强调与语气，动态强调退出后不输出旧 variant', () => {
    const emphasis = createState<'soft' | 'strong' | undefined>('soft')
    const selectedAppearance = createState<ButtonAppearance | undefined>(
      'filled',
    )
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <Button
          appearance={selectedAppearance}
          emphasis={emphasis}
          danger
          small
          loading
        >
          确认
        </Button>
      ),
      host,
    )
    const button = host.querySelector('button')!
    expect(button.dataset.appearance).toBe('filled')
    expect(button.dataset.emphasis).toBe('soft')
    expect(button.dataset.tone).toBe('danger')
    expect(button.dataset.size).toBe('small')
    expect(button.dataset.status).toBe('loading')
    expect(button.hasAttribute('data-variant')).toBe(false)
    for (const name of [
      'appearance',
      'emphasis',
      'tone',
      'strong',
      'danger',
      'small',
    ])
      expect(button.hasAttribute(name)).toBe(false)
    emphasis.set('strong')
    flush()
    expect(button.dataset.emphasis).toBe('strong')
    emphasis.set(undefined)
    flush()
    expect(button.hasAttribute('data-emphasis')).toBe(false)
    selectedAppearance.set('plain')
    flush()
    expect(button.dataset.appearance).toBe('plain')
    selectedAppearance.set(undefined)
    flush()
    expect(button.dataset.appearance).toBe('outlined')
  })

  test('外界生成前配置公开外观转换表，不引入旧样式属性', () => {
    const host = document.body.appendChild(document.createElement('div'))
    Object.assign(buttonMapping.appearance, { undefined: 'filled' })
    try {
      dispose = render(() => <Button>配置外观</Button>, host)
      const button = host.querySelector('button')!
      expect(button.dataset.appearance).toBe('filled')
      expect(button.hasAttribute('data-variant')).toBe(false)
    } finally {
      Object.assign(buttonMapping.appearance, { undefined: 'outlined' })
    }
  })

  test('独立背景 Token 在局部按钮消费自身状态，禁用与撤销不改原定义', async () => {
    mountButtonStyles()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <>
          <Button htmlProps={{ 'data-review': '' }}>审核</Button>
          <Button>普通</Button>
        </>
      ),
      host,
    )
    const [local, sibling] = host.querySelectorAll<HTMLButtonElement>('button')
    for (const button of [local, sibling]) button.style.transition = 'none'
    await userEvent.unhover(local)
    const initial = appearance(local)
    const path = ['@layer uikit', '.Button', '&[data-review]']
    const surface = token('rgb(210, 230, 250)', {
      address: path,
      state: [
        [whenHover, 'rgb(190, 215, 240)'],
        [whenActive, 'rgb(170, 200, 230)'],
      ],
    })
    const consumer = rules(path, { 'background-color': surface })
    handles.push(consumer)
    cssRoot.mount()
    expectSameColor(
      getComputedStyle(local).backgroundColor,
      'rgb(210, 230, 250)',
    )
    expectSameAppearance(appearance(sibling), initial)
    await userEvent.hover(local)
    expectSameColor(
      getComputedStyle(local).backgroundColor,
      'rgb(190, 215, 240)',
    )
    local.focus()
    await userEvent.keyboard('[Space>]')
    try {
      expectSameColor(
        getComputedStyle(local).backgroundColor,
        'rgb(170, 200, 230)',
      )
    } finally {
      await userEvent.keyboard('[/Space]')
    }
    local.blur()
    local.disabled = true
    expectSameColor(
      getComputedStyle(local).backgroundColor,
      'rgb(190, 215, 240)',
    )
    expectSameAppearance(appearance(sibling), initial)
    local.disabled = false
    await userEvent.unhover(local)
    consumer.remove()
    cssRoot.mount()
    expectSameAppearance(appearance(local), initial)
    expectSameAppearance(appearance(sibling), initial)
  })

  test('dangerous：最终背景色仍允许手动声明和修改，撤销后恢复且不污染兄弟', async () => {
    mountButtonStyles()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <>
          <Button class="LocalSurface">局部</Button>
          <Button>兄弟</Button>
        </>
      ),
      host,
    )
    const [local, sibling] = host.querySelectorAll<HTMLButtonElement>('button')
    for (const button of [local, sibling]) button.style.transition = 'none'
    await userEvent.unhover(local)
    const initial = appearance(local)
    const path = ['@layer uikit', '.Button', '&.LocalSurface']
    const selected = rules(path, [[buttonSurfaceColor, 'oklch(0.6 0.1 30)']])
    handles.push(selected)
    cssRoot.mount()
    expectSameColor(appearance(local)['background-color'], 'oklch(0.6 0.1 30)')
    expectSameAppearance(appearance(sibling), initial)
    await userEvent.hover(local)
    expectSameColor(appearance(local)['background-color'], 'oklch(0.6 0.1 30)')
    await userEvent.unhover(local)
    selected.remove()
    cssRoot.mount()
    expectSameAppearance(appearance(local), initial)
    const adjusted = rules(
      path,
      modify(buttonSurfaceColor, {
        type: 'expression',
        detail: (current) => oklch(current, { chroma: 0.2 }),
      }),
    )
    handles.push(adjusted)
    cssRoot.mount()
    expectSameColor(
      appearance(local)['background-color'],
      `oklch(from ${initial['background-color']} l 0.2 h / alpha)`,
    )
    expectSameAppearance(appearance(sibling), initial)
    adjusted.remove()
    cssRoot.mount()
    expectSameAppearance(appearance(local), initial)
    expectSameAppearance(appearance(sibling), initial)
  })

  test.each([undefined, 'plain', 'filled'] as const)(
    'dangerous：局部基色重声明保留两个作用域隔离及状态退出：%s',
    async (selectedAppearance) => {
      const palettes = [
        {
          tone: 'rgb(56, 120, 180)',
        },
        {
          tone: 'rgb(180, 56, 120)',
        },
      ]
      // 在已知外观的结构Address验证组合，不从平面选择器猜测DOM同时命中的分支。
      for (const [index, palette] of palettes.entries())
        handles.push(
          rules(
            [
              '@layer uikit',
              '.Button',
              ...(selectedAppearance
                ? [`&[data-appearance="${selectedAppearance}"]`]
                : []),
              `&[data-local-tone="${index}"]`,
            ],
            [[buttonColorSource, palette.tone]],
          ),
        )
      mountButtonStyles()
      const host = document.body.appendChild(document.createElement('div'))
      dispose = render(
        () =>
          palettes.map((_, index) => (
            <Button
              appearance={selectedAppearance}
              danger
              htmlProps={{ 'data-local-tone': index }}
            >
              局部语气
            </Button>
          )),
        host,
      )
      const buttons = Array.from(
        host.querySelectorAll<HTMLButtonElement>('button'),
      )
      const samples: {
        normal: Record<string, string>
        hover: Record<string, string>
        active: Record<string, string>
      }[] = []
      for (const [index, button] of buttons.entries()) {
        button.style.transition = 'none'
        const normal = appearance(button)
        expectSameColor(
          normal.color,
          selectedAppearance === 'filled'
            ? getComputedStyle(document.documentElement).getPropertyValue(
                '--' + paperColor.name,
              )
            : palettes[index].tone,
        )
        if (selectedAppearance === 'filled')
          expectSameColor(normal['background-color'], palettes[index].tone)
        if (selectedAppearance === 'plain')
          expectSameColor(normal['background-color'], 'transparent')
        button.focus()
        await userEvent.keyboard('[ArrowRight]')
        expect(button.matches(':focus-visible')).toBe(true)
        expectSameColor(
          getComputedStyle(button).outlineColor,
          `oklch(from ${palettes[index].tone} l c h / 0.44)`,
        )
        await userEvent.hover(button)
        const hover = appearance(button)
        expectSameColor(hover['background-color'], normal['background-color'])
        await userEvent.keyboard('[Space>]')
        let active: Record<string, string>
        try {
          expect(button.matches(':hover:active')).toBe(true)
          active = appearance(button)
          expectSameColor(active['background-color'], hover['background-color'])
          expect(active.transform).not.toBe('none')
          expectSameColor(active.color, normal.color)
        } finally {
          await userEvent.keyboard('[/Space]')
        }
        expectSameAppearance(appearance(button), hover)
        await userEvent.unhover(button)
        button.blur()
        expectSameAppearance(appearance(button), normal)
        samples.push({ normal, hover, active: active! })
      }
      for (const state of ['normal', 'hover', 'active'] as const) {
        if (selectedAppearance !== 'filled')
          expect(samples[0][state].color).not.toBe(samples[1][state].color)
        if (selectedAppearance !== 'plain')
          expect(samples[0][state]['background-color']).not.toBe(
            samples[1][state]['background-color'],
          )
      }
      if (selectedAppearance === 'plain') {
        for (const sample of samples) {
          expectSameColor(sample.hover['background-color'], 'transparent')
          expectSameColor(sample.active['background-color'], 'transparent')
        }
      }
    },
  )

  test.each([undefined, 'plain', 'filled'] as const)(
    'dangerous：手动覆盖最终角色后禁用仍降低整体声量并恢复：%s',
    async (selectedAppearance) => {
      const surface = 'rgb(12, 34, 56)'
      const content = 'rgb(78, 90, 123)'
      handles.push(
        rules('.Button[data-local-role]', [
          declare(buttonSurfaceColor, surface),
          declare(buttonContentColor, content),
        ]),
      )
      mountButtonStyles()
      const host = document.body.appendChild(document.createElement('div'))
      dispose = render(
        () => (
          <Button
            appearance={selectedAppearance}
            danger
            htmlProps={{ 'data-local-role': '' }}
          >
            局部禁用
          </Button>
        ),
        host,
      )
      const button = host.querySelector('button')!
      button.style.transition = 'none'
      const read = () => [
        getComputedStyle(button).backgroundColor,
        getComputedStyle(button).color,
      ]
      const normal = read()
      const normalOpacity = getComputedStyle(button).opacity
      expectSameColors(normal, [surface, content])
      button.disabled = true
      await userEvent.hover(button)
      expectSameColors(read(), normal)
      expect(Number(getComputedStyle(button).opacity)).toBe(0.48)
      button.disabled = false
      button.dataset.status = 'disabled'
      button.focus()
      await userEvent.keyboard('[Space>]')
      try {
        expect(button.matches(':hover:active')).toBe(true)
        expectSameColors(read(), normal)
        expect(getComputedStyle(button).transform).toBe('none')
      } finally {
        await userEvent.keyboard('[/Space]')
      }
      await userEvent.unhover(button)
      delete button.dataset.status
      expectSameColors(read(), normal)
      expect(getComputedStyle(button).opacity).toBe(normalOpacity)
    },
  )

  test('filled 常态背景保留组件 buttonSurfaceColor 的局部覆盖', () => {
    handles.push(
      rules('.Button[data-appearance="filled"][data-surface-probe]', [
        declare(buttonSurfaceColor, 'rgb(12, 34, 56)'),
      ]),
    )
    mountButtonStyles()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <Button filled htmlProps={{ 'data-surface-probe': '' }}>
          局部表面
        </Button>
      ),
      host,
    )
    const button = host.querySelector('button')!
    button.style.transition = 'none'
    expectSameColor(getComputedStyle(button).backgroundColor, 'rgb(12, 34, 56)')
  })

  test.each(['light', 'dark'])(
    '%s：声量、语气与状态独立组合，反馈与退出保持层次',
    async (theme) => {
      document.documentElement.dataset.theme = theme
      mountButtonStyles()
      const host = document.body.appendChild(document.createElement('div'))
      const appearances: (ButtonAppearance | undefined)[] = [
        undefined,
        'plain',
        'filled',
      ]
      const tones: ('danger' | undefined)[] = [undefined, 'danger']
      dispose = render(
        () =>
          appearances.flatMap((selectedAppearance) =>
            tones.map((tone) => (
              <Button appearance={selectedAppearance} tone={tone}>
                组合
              </Button>
            )),
          ),
        host,
      )
      const buttons = Array.from(
        host.querySelectorAll<HTMLButtonElement>('button'),
      )
      for (const [index, button] of buttons.entries()) {
        button.style.transition = 'none'
        await userEvent.unhover(button)
        const normal = appearance(button)
        const selectedAppearance = appearances[Math.floor(index / 2)]
        const danger = tones[index % 2] === 'danger'
        if (selectedAppearance === 'plain')
          expectSameColor(normal['background-color'], 'transparent')
        expect(Number(normal.opacity)).toBeGreaterThan(0.48)
        expect(Number(normal.opacity)).toBeLessThanOrEqual(1)
        await userEvent.hover(button)
        const hover = appearance(button)
        if (selectedAppearance === 'plain')
          expectSameColor(hover['background-color'], 'transparent')
        else if (danger)
          expectSameColor(hover['background-color'], normal['background-color'])
        else
          expect(hover['background-color']).not.toBe(normal['background-color'])
        button.focus()
        await userEvent.keyboard('[Space>]')
        try {
          expect(button.matches(':hover:active')).toBe(true)
          if (selectedAppearance === 'plain')
            expectSameColor(
              appearance(button)['background-color'],
              'transparent',
            )
          else if (danger)
            expectSameColor(
              appearance(button)['background-color'],
              normal['background-color'],
            )
          else
            expect(appearance(button)['background-color']).not.toBe(
              hover['background-color'],
            )
          expect(appearance(button).transform).not.toBe('none')
        } finally {
          await userEvent.keyboard('[/Space]')
        }
        expectSameAppearance(appearance(button), hover)
        await userEvent.unhover(button)
        button.blur()
        expectSameAppearance(appearance(button), normal)
      }
      for (const toneIndex of [0, 1]) {
        const normal = appearance(buttons[toneIndex])
        const filled = appearance(buttons[4 + toneIndex])
        expect(chroma(filled['background-color'])).toBeGreaterThan(
          chroma(normal['background-color']),
        )
        expect(filled['color']).not.toBe(normal['color'])
      }
      for (const appearanceIndex of [0, 1, 2]) {
        const ordinary = buttons[appearanceIndex * 2]
        const danger = buttons[appearanceIndex * 2 + 1]
        // plain 的透明背景以文字承担语气，其余声量同时以表面承担。
        if (appearanceIndex !== 2)
          expect(appearance(ordinary).color).not.toBe(appearance(danger).color)
        if (appearanceIndex !== 1)
          expect(appearance(ordinary)['background-color']).not.toBe(
            appearance(danger)['background-color'],
          )
      }
    },
  )

  test('隔离来源：停用 TS 样式会失去实心背景，恢复挂载后恢复', () => {
    mountButtonStyles()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Button filled>隔离</Button>, host)
    const button = host.querySelector<HTMLButtonElement>('button')!
    button.style.transition = 'none'
    const before = appearance(button)
    const style =
      document.head.querySelector<HTMLStyleElement>(buttonStyleSelector)!
    style.sheet!.disabled = true
    expect(appearance(button)['background-color']).not.toBe(
      before['background-color'],
    )
    style.sheet!.disabled = false
    expectSameAppearance(appearance(button), before)
  })

  test.each(['light', 'dark'])(
    '%s：所有 appearance、tone、size 与 loading 的禁用组合保持各 feature 的覆盖',
    (theme) => {
      document.documentElement.dataset.theme = theme
      const style = document.createElement('style')
      style.id = 'css-root'
      document.head.append(style)
      cssRoot.mount()

      const appearances: (ButtonAppearance | undefined)[] = [
        undefined,
        'plain',
        'filled',
      ]
      const tones: ('danger' | undefined)[] = [undefined, 'danger']
      const sizes: ButtonProps['size'][] = [
        undefined,
        'small',
        'large',
        'xlarge',
      ]
      const cases = appearances.flatMap((selectedAppearance) =>
        tones.flatMap((tone) =>
          sizes.flatMap((size) =>
            [false, true].flatMap((loading) =>
              ['native', 'status', 'both'].map((mode) => ({
                selectedAppearance,
                tone,
                size,
                loading,
                mode,
              })),
            ),
          ),
        ),
      )
      const host = document.body.appendChild(document.createElement('div'))
      dispose = render(
        () =>
          cases.map((entry, index) => (
            <Button
              appearance={entry.selectedAppearance}
              tone={entry.tone}
              size={entry.size}
              loading={entry.loading}
              disabled
              htmlProps={{ 'data-testid': `disabled-${index}` }}
            >
              禁用
            </Button>
          )),
        host,
      )

      for (const [index, entry] of cases.entries()) {
        const button = host.querySelector<HTMLButtonElement>(
          `[data-testid="disabled-${index}"]`,
        )!
        if (entry.mode === 'native')
          button.dataset.status = entry.loading ? 'loading' : ''
        if (entry.mode === 'status') button.disabled = false
        button.style.transition = 'none'
        expect(
          button.matches(':is(:disabled, [data-status~="disabled"])'),
        ).toBe(true)
        const computed = getComputedStyle(button)
        expect(computed.boxShadow).toBe('none')
        expect(computed.cursor).toBe('not-allowed')
        expect(Number(computed.opacity)).toBe(0.48)
        expect(computed.transform).toBe('none')
        expect(computed.minHeight).toBe(
          entry.size === 'small'
            ? '32px'
            : entry.size === 'large'
              ? '64px'
              : entry.size === 'xlarge'
                ? '80px'
                : '48px',
        )
      }
    },
  )

  test('挂载 Button 样式保留其他组件的静态样式和阴影契约', () => {
    const shadows = [
      [baseShadowSmall, '--shadow-1'],
      [baseShadow, '--shadow-2'],
    ] as const
    const probes = shadows.map(([material, cssName], index) => {
      const reference = document.body.appendChild(document.createElement('div'))
      reference.style.boxShadow = `var(${cssName})`
      const actual = document.body.appendChild(document.createElement('div'))
      actual.className = `shadow-probe-${index}`
      handles.push(rule(`.shadow-probe-${index}`, 'box-shadow', material))
      return { reference, actual }
    })
    const input = document.body.appendChild(document.createElement('input'))
    input.className = 'Input'
    const popover = document.body.appendChild(document.createElement('div'))
    popover.className = 'Popover'
    const nonButton = [
      ...probes.map((probe) => probe.reference),
      input,
      popover,
    ]
    const style = mountButtonStyles()
    for (const theme of ['light', 'dark']) {
      document.documentElement.dataset.theme = theme
      style.sheet!.disabled = true
      const before = nonButton.map((element) => ({
        ...appearance(element),
        outline: getComputedStyle(element).outlineColor,
      }))
      style.sheet!.disabled = false
      expect(
        nonButton.map((element) => ({
          ...appearance(element),
          outline: getComputedStyle(element).outlineColor,
        })),
      ).toEqual(before)
      for (const { actual, reference } of probes) {
        const actualShadow = getComputedStyle(actual).boxShadow
        const expectedShadow = getComputedStyle(reference).boxShadow
        const colors = /(?:rgba?|oklch)\([^)]*\)/g
        expect(actualShadow.replace(colors, 'COLOR')).toBe(
          expectedShadow.replace(colors, 'COLOR'),
        )
        const expectedColors = expectedShadow.match(colors)!
        actualShadow
          .match(colors)!
          .forEach((color, index) =>
            expectSameColor(color, expectedColors[index], 1 / 255),
          )
      }
    }
  })

  test('Button 消费 JS 品牌材料，局部品牌覆盖改变主体并保留相邻组件', () => {
    // 当地登记实际输入，随后只改变CSS值即可验证已发布表达式。
    handles.push(
      rules(['@layer uikit', '.Button'], [declare(brandColor, 'inherit')]),
    )
    const style = mountButtonStyles()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <>
          <Button filled htmlProps={{ 'data-testid': 'local-brand' }}>
            品牌
          </Button>
          <Button filled htmlProps={{ 'data-testid': 'neighbor-brand' }}>
            邻居
          </Button>
        </>
      ),
      host,
    )
    const button = host.querySelector<HTMLButtonElement>(
      '[data-testid="local-brand"]',
    )!
    const neighbor = host.querySelector<HTMLButtonElement>(
      '[data-testid="neighbor-brand"]',
    )!
    button.style.transition = 'none'
    neighbor.style.transition = 'none'
    const before = getComputedStyle(neighbor).backgroundColor
    const originalCSS = style.textContent
    button.style.setProperty('--brand-color', 'oklch(60% 0.15 140)')
    expect(getComputedStyle(button).backgroundColor).not.toBe(before)
    expect(getComputedStyle(neighbor).backgroundColor).toBe(before)
    expect(style.textContent).toBe(originalCSS)
  })
  test('公开控制点可在后代读取并复用状态，局部修改不影响相邻按钮和全局基准', () => {
    const copiedTextState = token('10px', {
      name: 'public-button-control-text-state',
      address: '.Button .PublicControlProbe',
      state: buttonTextSize.state,
    })
    handles.push(
      rules('.Button .PublicControlProbe', {
        'font-size': copiedTextState,
        'letter-spacing': buttonTextSize,
        'margin-left': buttonGap,
        'min-height': buttonMinHeight,
        'padding-right': buttonPaddingBlock,
      }),
      rules('.PublicGlobalControlProbe', {
        'font-size': textSize,
        'min-height': controlSize,
      }),
    )
    mountButtonStyles()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <>
          <Button size="large" htmlProps={{ 'data-control': 'local' }}>
            <span class="PublicControlProbe" data-size="large">
              局部读取
            </span>
          </Button>
          <Button size="large">
            <span class="PublicControlProbe" data-size="large">
              相邻读取
            </span>
          </Button>
        </>
      ),
      host,
    )
    const global = host.appendChild(document.createElement('div'))
    global.className = 'PublicGlobalControlProbe'
    const [local, neighbor] = host.querySelectorAll('button')
    const read = (button: HTMLButtonElement) => {
      button.style.transition = 'none'
      const own = getComputedStyle(button)
      const child = getComputedStyle(
        button.querySelector('.PublicControlProbe')!,
      )
      return [
        own.fontSize,
        own.minHeight,
        own.columnGap,
        child.letterSpacing,
        child.minHeight,
        child.paddingRight,
        child.fontSize,
        child.marginLeft,
      ]
    }
    const baseline = [
      '20px',
      '64px',
      '12px',
      '20px',
      '64px',
      '12px',
      '12.5px',
      '12px',
    ]
    expect(read(local)).toEqual(baseline)
    expect(read(neighbor)).toEqual(baseline)
    const globalBefore = [
      getComputedStyle(global).fontSize,
      getComputedStyle(global).minHeight,
    ]
    expect(globalBefore).toEqual(['16px', '48px'])
    handles.push(
      rules(
        ['@layer public-button-controls', '.Button[data-control="local"]'],
        [
          modify(buttonTextSize, { type: 'expression', detail: () => '28px' }),
          modify(buttonMinHeight, { type: 'expression', detail: () => '90px' }),
        ],
      ),
    )
    cssRoot.mount()
    expect(read(local)).toEqual([
      '28px',
      '90px',
      '12px',
      '28px',
      '90px',
      '12px',
      '12.5px',
      '12px',
    ])
    expect(read(neighbor)).toEqual(baseline)
    expect([
      getComputedStyle(global).fontSize,
      getComputedStyle(global).minHeight,
    ]).toEqual(globalBefore)
  })

  test('修改公共基准后四尺寸与间距文字自然联动，不重新生成样式', () => {
    const style = mountButtonStyles()
    const host = document.body.appendChild(document.createElement('div'))
    const sizes: ButtonProps['size'][] = ['small', undefined, 'large', 'xlarge']
    dispose = render(
      () => sizes.map((size) => <Button size={size}>相对基准</Button>),
      host,
    )
    const buttons = [...host.querySelectorAll('button')]
    const fields = [
      'min-height',
      'column-gap',
      'padding-block-start',
      'padding-inline-start',
      'font-size',
      'opacity',
    ]
    const read = () =>
      buttons.map((button) =>
        fields.map((field) =>
          parseFloat(getComputedStyle(button).getPropertyValue(field)),
        ),
      )
    buttons.forEach((button) => {
      button.style.transition = 'none'
    })
    const before = read()
    const css = style.textContent
    const bases = [
      [controlSize, '72px'],
      [baseSpace, '16px'],
      [textSize, '24px'],
      [baseOpacity, '0.5'],
    ] as const
    try {
      bases.forEach(([base, value]) =>
        document.documentElement.style.setProperty(
          `--${base.name!.replace(/^--/, '')}`,
          value,
        ),
      )
      const ratios = [1.5, 2, 2, 2, 1.5, 0.5]
      read().forEach((values, row) =>
        values.forEach((value, column) =>
          expect(value).toBeCloseTo(before[row][column] * ratios[column], 5),
        ),
      )
      expect(style.textContent).toBe(css)
    } finally {
      bases.forEach(([base]) =>
        document.documentElement.style.removeProperty(
          `--${base.name!.replace(/^--/, '')}`,
        ),
      )
    }
  })

  test('四尺寸、方圆角、内容与拉伸容器保持旧布局，后置 layer 可覆盖', () => {
    mountButtonStyles()
    const sizes: ButtonProps['size'][] = ['small', undefined, 'large', 'xlarge']
    const host = document.body.appendChild(document.createElement('div'))
    host.style.cssText = 'display:flex; flex-direction:column; gap:16px'
    dispose = render(
      () =>
        sizes.flatMap((size) => [
          <Button size={size}>普通文字</Button>,
          <Button size={size}>
            <span aria-hidden="true">＋</span>
            <span>图标文字</span>
          </Button>,
          <Button size={size} htmlProps={{ style: 'max-width:160px' }}>
            窄容器中较长的按钮内容换行
          </Button>,
        ]),
      host,
    )
    for (const button of Array.from(
      host.querySelectorAll<HTMLButtonElement>('button'),
    )) {
      const actual = getComputedStyle(button)
      expect(actual.display).toBe('flex')
      expect(actual.alignSelf).toBe('center')
      expect(actual.alignItems).toBe('center')
      expect(actual.justifyContent).toBe('center')
      expect(actual.borderRadius).toBe('999px')
      expect(actual.getPropertyValue('corner-shape')).toBe('superellipse(2)')
      const children = button.querySelectorAll('span')
      if (children.length === 2)
        expect(
          children[1].getBoundingClientRect().left -
            children[0].getBoundingClientRect().right,
        ).toBeCloseTo(parseFloat(actual.columnGap), 5)
    }
    const stretch = document.body.appendChild(document.createElement('div'))
    stretch.style.cssText = 'display:flex;height:120px'
    const button = host.querySelectorAll<HTMLButtonElement>('button')[3]
    stretch.append(button)
    expect(button.getBoundingClientRect().height).toBe(48)
    expect(
      button.getBoundingClientRect().top - stretch.getBoundingClientRect().top,
    ).toBe(36)
    expect(
      getComputedStyle(button)
        .transitionDuration.split(',')
        .every((duration) => duration.trim() === '0.12s'),
    ).toBe(true)
    const override = document.body.appendChild(document.createElement('style'))
    override.textContent =
      '@layer button-test-override { .Button { background-color: rgb(1, 2, 3); } }'
    button.style.transition = 'none'
    expect(getComputedStyle(button).backgroundColor).toBe('rgb(1, 2, 3)')
  })

  test('disabled 与 hover 独立生效，禁用透明度和禁止指针持续保留', async () => {
    const style = document.createElement('style')
    style.id = 'css-root'
    document.head.append(style)
    cssRoot.mount()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <>
          <Button loading>启用</Button>
          <Button filled loading disabled>
            禁用
          </Button>
        </>
      ),
      host,
    )
    const [enabled, disabledButton] =
      host.querySelectorAll<HTMLButtonElement>('button')
    enabled.style.transition = 'none'
    disabledButton.style.transition = 'none'
    expect(getComputedStyle(enabled).cursor).toBe('progress')
    enabled.focus()
    await userEvent.keyboard('[Space>]')
    try {
      expect(enabled.matches(':active')).toBe(true)
      expect(getComputedStyle(enabled).transform).not.toBe('none')
    } finally {
      await userEvent.keyboard('[/Space]')
    }

    // 原生禁用与 UIKit 标记均匹配；移除原生属性后可以真实按下，以验证标记禁用交集。
    const disabledAppearance = () => {
      const computed = getComputedStyle(disabledButton)
      return [
        computed.backgroundColor,
        computed.color,
        computed.boxShadow,
        computed.cursor,
        computed.opacity,
        computed.transform,
      ]
    }
    const before = disabledAppearance()
    await userEvent.hover(disabledButton)
    expect(disabledButton.matches(':hover')).toBe(true)
    expect(disabledAppearance()[0]).not.toBe(before[0])
    expect(disabledAppearance().slice(2)).toEqual(before.slice(2))
    disabledButton.disabled = false
    disabledButton.focus()
    await userEvent.keyboard('[Space>]')
    try {
      expect(disabledButton.matches(':active')).toBe(true)
      expect(disabledAppearance()[0]).not.toBe(before[0])
      expect(disabledAppearance().slice(2)).toEqual(before.slice(2))
      expect(getComputedStyle(disabledButton).cursor).toBe('not-allowed')
    } finally {
      await userEvent.keyboard('[/Space]')
    }
    disabledButton.dataset.status = 'loading'
    expect(getComputedStyle(disabledButton).cursor).toBe('progress')
    disabledButton.dataset.status = ''
    expect(getComputedStyle(disabledButton).cursor).toBe('pointer')
    enabled.dataset.status = ''
    expect(getComputedStyle(enabled).cursor).toBe('pointer')
  })

  test('focus-visible 建立完整边界，danger 只覆盖颜色', async () => {
    const style = document.createElement('style')
    style.id = 'css-root'
    document.head.append(style)
    cssRoot.mount()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <>
          <Button htmlProps={{ 'data-testid': 'focus-default' }}>默认</Button>
          <Button danger htmlProps={{ 'data-testid': 'focus-danger' }}>
            危险
          </Button>
        </>
      ),
      host,
    )
    const defaultButton = host.querySelector<HTMLButtonElement>(
      '[data-testid="focus-default"]',
    )!
    const dangerButton = host.querySelector<HTMLButtonElement>(
      '[data-testid="focus-danger"]',
    )!
    const reference = document.body.appendChild(document.createElement('div'))
    handles.push(
      rule(
        '.focus-reference-interactive',
        'color',
        oklch(brandColor, { alpha: 0.44 }),
      ),
    )
    handles.push(
      rule('.focus-reference-bad', 'color', oklch(badColor, { alpha: 0.44 })),
    )
    cssRoot.mount()
    reference.className = 'focus-reference-interactive'
    const interactiveLine = getComputedStyle(reference).color
    reference.className = 'focus-reference-bad'
    const badLine = getComputedStyle(reference).color

    await userEvent.unhover(dangerButton)
    await userEvent.unhover(defaultButton)
    await userEvent.tab()
    expect(document.activeElement).toBe(defaultButton)
    expect(defaultButton.matches(':focus-visible')).toBe(true)
    const defaultStyle = getComputedStyle(defaultButton)
    expect(defaultStyle.outlineWidth).toBe('2px')
    expect(defaultStyle.outlineStyle).toBe('solid')
    expect(defaultStyle.outlineOffset).toBe('2px')
    expect(defaultStyle.outlineColor).toBe(interactiveLine)

    await userEvent.tab()
    expect(document.activeElement).toBe(dangerButton)
    expect(dangerButton.matches(':focus-visible')).toBe(true)
    const dangerStyle = getComputedStyle(dangerButton)
    expect(dangerStyle.outlineWidth).toBe('2px')
    expect(dangerStyle.outlineStyle).toBe('solid')
    expect(dangerStyle.outlineOffset).toBe('2px')
    expect(dangerStyle.outlineColor).toBe(badLine)
  })

  test('模块导入只登记，应用在首次渲染前统一挂载全部样式', async () => {
    expect(document.head.querySelector(buttonStyleSelector)).toBeNull()

    const style = document.createElement('style')
    style.id = 'css-root'
    document.head.append(style)
    expect(style.sheet!.cssRules).toHaveLength(0)

    // 明确采用可覆盖的全局表面入口，保留挂载后CSS变化及规则身份验证。
    handles.push(
      rules(
        ['@layer uikit', '.Button'],
        [declare(globalColors.surfaceColor, 'inherit')],
      ),
    )
    handles.push(
      rules('.shared-input', [
        [$borderRadius, baseRadius],
        contentLayout({ padding: ['8px', multiply(baseSpace, 1 / 2)] }),
      ]),
    )
    cssRoot.mount()
    const beforeRender = Array.from(style.sheet!.cssRules)
    expect(beforeRender.length).toBeGreaterThan(0)

    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <>
          <Button htmlProps={{ 'data-testid': 'default' }}>
            <span>Default</span>
            <span>Action</span>
          </Button>
          <Button filled htmlProps={{ 'data-testid': 'filled' }}>
            Filled
          </Button>
          <Button plain htmlProps={{ 'data-testid': 'plain' }}>
            Plain
          </Button>
          <Button filled danger htmlProps={{ 'data-testid': 'danger' }}>
            Danger
          </Button>
          <Button small htmlProps={{ 'data-testid': 'small' }}>
            Small
          </Button>
          <Button large htmlProps={{ 'data-testid': 'large' }}>
            Large
          </Button>
          <Button xlarge htmlProps={{ 'data-testid': 'xlarge' }}>
            XLarge
          </Button>
          <Button loading htmlProps={{ 'data-testid': 'loading' }}>
            Loading
          </Button>
          <Button disabled htmlProps={{ 'data-testid': 'disabled' }}>
            Disabled
          </Button>
        </>
      ),
      host,
    )

    const getButton = (name: string) =>
      document.querySelector<HTMLElement>(`[data-testid="${name}"]`)!
    const input = document.createElement('input')
    input.className = 'shared-input'
    host.append(input)
    const afterRender = Array.from(style.sheet!.cssRules)
    expect(afterRender).toHaveLength(beforeRender.length)
    for (let index = 0; index < beforeRender.length; index++)
      expect(afterRender[index]).toBe(beforeRender[index])
    expect(getComputedStyle(input).borderTopLeftRadius).toBe('4px')
    expect(getComputedStyle(getButton('default')).borderTopLeftRadius).toBe(
      '999px',
    )
    expect(getComputedStyle(input).paddingLeft).toBe('4px')
    expect(getComputedStyle(input).paddingTop).toBe('8px')
    host.querySelectorAll<HTMLElement>('button').forEach((button) => {
      button.style.transition = 'none'
    })
    const defaultButton = getButton('default')
    defaultButton.style.width = '240px'
    const defaultStyle = getComputedStyle(defaultButton)
    const filledStyle = getComputedStyle(getButton('filled'))
    const plainStyle = getComputedStyle(getButton('plain'))
    const dangerStyle = getComputedStyle(getButton('danger'))
    const smallStyle = getComputedStyle(getButton('small'))
    const xlargeStyle = getComputedStyle(getButton('xlarge'))
    const disabledStyle = getComputedStyle(getButton('disabled'))

    expect(style).not.toBeNull()
    expect(document.head.querySelectorAll(buttonStyleSelector)).toHaveLength(1)
    const [firstContent, secondContent] =
      defaultButton.querySelectorAll<HTMLElement>('span')
    const buttonRect = defaultButton.getBoundingClientRect()
    const firstRect = firstContent.getBoundingClientRect()
    const secondRect = secondContent.getBoundingClientRect()
    expect(secondRect.left).toBeGreaterThan(firstRect.right)
    expect(secondRect.left - firstRect.right).toBeCloseTo(8, 0)
    expect((firstRect.left + secondRect.right) / 2).toBeCloseTo(
      (buttonRect.left + buttonRect.right) / 2,
      0,
    )
    expect((firstRect.top + firstRect.bottom) / 2).toBeCloseTo(
      (buttonRect.top + buttonRect.bottom) / 2,
      0,
    )
    expect((secondRect.top + secondRect.bottom) / 2).toBeCloseTo(
      (buttonRect.top + buttonRect.bottom) / 2,
      0,
    )
    expect(defaultStyle.minHeight).toBe('48px')
    expect(defaultStyle.fontSize).toBe('16px')
    expect(defaultStyle.paddingTop).toBe('8px')
    expect(defaultStyle.paddingLeft).toBe('24px')
    expect(defaultStyle.borderTopWidth).toBe('1px')
    expect(defaultStyle.borderTopStyle).toBe('solid')
    expect(filledStyle.backgroundColor).not.toBe(defaultStyle.backgroundColor)
    expect(plainStyle.backgroundColor).not.toBe(defaultStyle.backgroundColor)
    expect(filledStyle.backgroundColor).not.toBe(dangerStyle.backgroundColor)
    expect(Number.parseFloat(xlargeStyle.minHeight)).toBeGreaterThan(
      Number.parseFloat(smallStyle.minHeight),
    )
    expect(smallStyle.minHeight).toBe('32px')
    expect(smallStyle.fontSize).toBe('14px')
    expect(smallStyle.columnGap).toBe('4px')
    expect(smallStyle.paddingBlockStart).toBe('4px')
    const largeStyle = getComputedStyle(getButton('large'))
    expect(largeStyle.minHeight).toBe('64px')
    expect(largeStyle.fontSize).toBe('20px')
    expect(largeStyle.columnGap).toBe('12px')
    expect(largeStyle.paddingBlockStart).toBe('12px')
    expect(xlargeStyle.minHeight).toBe('80px')
    expect(xlargeStyle.fontSize).toBe('24px')
    expect(xlargeStyle.columnGap).toBe('16px')
    expect(xlargeStyle.paddingBlockStart).toBe('12px')
    expect(getComputedStyle(getButton('loading')).cursor).toBe('progress')
    expect(disabledStyle.cursor).toBe('not-allowed')
    expect(Number(disabledStyle.opacity)).toBe(0.48)

    const defaultBackground = defaultStyle.backgroundColor
    await userEvent.hover(getButton('default'))
    expect(getComputedStyle(getButton('default')).backgroundColor).not.toBe(
      defaultBackground,
    )
    await userEvent.unhover(getButton('default'))

    handles.push(
      rule(
        '.Button[data-testid="default"]',
        $backgroundColor,
        token('rgb(1, 2, 3)', {
          name: 'browser-button-color',
          address: '.Button[data-testid="default"]',
          state: Object.fromEntries([['hover', 'rgb(4, 5, 6)']]),
        }),
      ),
    )
    cssRoot.mount()
    await userEvent.hover(getButton('default'))
    expect(getComputedStyle(getButton('default')).backgroundColor).toBe(
      'rgb(4, 5, 6)',
    )
    await userEvent.unhover(getButton('default'))
    handles.pop()!.remove()
    cssRoot.mount()

    const disabledButton = getButton('disabled')
    disabledButton.style.transition = 'none'
    const disabledBackground = getComputedStyle(disabledButton).backgroundColor
    await userEvent.hover(disabledButton)
    expect(getComputedStyle(disabledButton).backgroundColor).not.toBe(
      disabledBackground,
    )
    expect(Number(getComputedStyle(disabledButton).opacity)).toBeCloseTo(0.48)

    const originalBackground = getComputedStyle(
      getButton('default'),
    ).backgroundColor
    getButton('default').style.setProperty(
      `--${globalColors.surfaceColor.name!.replace(/^--/, '')}`,
      'oklch(0.2 0.003 260)',
    )
    expect(getComputedStyle(getButton('default')).backgroundColor).not.toBe(
      originalBackground,
    )
    const beforeMount = Array.from(style.sheet!.cssRules)
    cssRoot.mount()
    const afterMount = Array.from(style.sheet!.cssRules)
    expect(afterMount).toHaveLength(beforeMount.length)
    for (let index = 0; index < beforeMount.length; index++)
      expect(afterMount[index]).toBe(beforeMount[index])
  })
})

test('危险Button只改一个语气输入，内容与边线一起采用当地颜色且不污染兄弟', () => {
  const selected = 'oklch(0.65 0.12 145)'
  handles.push(rule('.Button.LocalTone', buttonColorSource, selected))
  mountButtonStyles()
  const host = document.body.appendChild(document.createElement('div'))
  dispose = render(
    () => (
      <>
        <Button danger class="LocalTone">
          当地危险
        </Button>
        <Button danger>原危险</Button>
      </>
    ),
    host,
  )
  const [local, sibling] = host.querySelectorAll<HTMLButtonElement>('button')
  for (const element of [local, sibling]) element.style.transition = 'none'
  expectSameColor(getComputedStyle(local).color, selected)
  expectSameColor(
    getComputedStyle(local).borderTopColor,
    `oklch(from ${selected} l c h / 0.44)`,
  )
  expectSameColor(
    getComputedStyle(sibling).color,
    getComputedStyle(document.documentElement).getPropertyValue(
      `--${badColor.name!.replace(/^--/, '')}`,
    ),
  )
  expect(getComputedStyle(local).backgroundColor).not.toBe(
    getComputedStyle(sibling).backgroundColor,
  )
})

test('全局表面和内容来源联动真实Button，区域及组件覆盖保持隔离', async () => {
  const { surfaceColor, contentColor } = globalColors
  expect(surfaceColor, '必须提供全局表面来源').toBeDefined()
  expect(contentColor, '必须提供全局内容来源').toBeDefined()
  handles.push(
    rules('.ThemeRoot', [
      declare(surfaceColor, 'rgb(220, 230, 240)'),
      declare(contentColor, 'rgb(20, 30, 40)'),
    ]),
  )
  handles.push(
    rules('.ThemeLocal', [
      declare(surfaceColor, 'rgb(180, 210, 190)'),
      declare(contentColor, 'rgb(60, 70, 80)'),
    ]),
  )
  handles.push(
    rules('.ComponentLocal .Button', [
      declare(buttonSurfaceColor, 'rgb(240, 200, 180)'),
      declare(buttonContentColor, 'rgb(90, 80, 70)'),
    ]),
  )
  const style = mountButtonStyles()
  const root = document.body.appendChild(document.createElement('div'))
  root.className = 'ThemeRoot'
  dispose = render(
    () => (
      <>
        <Button>普通</Button>
        <div class="ThemeLocal">
          <Button>区域</Button>
        </div>
        <div class="ComponentLocal">
          <Button>组件</Button>
        </div>
        <Button filled danger>
          危险
        </Button>
      </>
    ),
    root,
  )
  const [normal, local, own, danger] = Array.from(
    root.querySelectorAll<HTMLButtonElement>('button'),
  )
  for (const button of [normal, local, own, danger])
    button.style.transition = 'none'
  const background = (button: HTMLElement, canvas: string, strength = 0.18) => {
    const source = getComputedStyle(button).getPropertyValue(
      `--${buttonColorSource.name!.replace(/^--/, '')}`,
    )
    expectSameColor(
      getComputedStyle(button).backgroundColor,
      'color-mix(in oklab, ' +
        'oklch(from ' +
        source +
        ' l c h / calc(alpha * 0.14))' +
        ' ' +
        strength * 100 +
        '%, ' +
        canvas +
        ')',
    )
  }
  background(normal, 'rgb(220, 230, 240)')
  background(local, 'rgb(180, 210, 190)')
  expectSameColor(getComputedStyle(own).backgroundColor, 'rgb(240, 200, 180)')
  expectSameColor(getComputedStyle(normal).color, 'rgb(20, 30, 40)')
  expectSameColor(getComputedStyle(local).color, 'rgb(60, 70, 80)')
  expectSameColor(getComputedStyle(own).color, 'rgb(90, 80, 70)')
  const dangerBefore = appearance(danger)
  const cssBefore = style.textContent
  root.style.setProperty(
    `--${surfaceColor.name!.replace(/^--/, '')}`,
    'rgb(200, 180, 230)',
  )
  root.style.setProperty(
    `--${contentColor.name!.replace(/^--/, '')}`,
    'rgb(100, 40, 60)',
  )
  background(normal, 'rgb(200, 180, 230)')
  background(local, 'rgb(180, 210, 190)')
  expectSameColor(getComputedStyle(own).backgroundColor, 'rgb(240, 200, 180)')
  expectSameColor(getComputedStyle(normal).color, 'rgb(100, 40, 60)')
  expectSameAppearance(appearance(danger), dangerBefore)
  await userEvent.hover(normal)
  background(normal, 'rgb(200, 180, 230)')
  normal.focus()
  await userEvent.keyboard('[Space>]')
  try {
    background(normal, 'rgb(200, 180, 230)')
  } finally {
    await userEvent.keyboard('[/Space]')
  }
  await userEvent.unhover(normal)
  normal.blur()
  normal.disabled = true
  await userEvent.hover(normal)
  background(normal, 'rgb(200, 180, 230)')
  expect(Number(getComputedStyle(normal).opacity)).toBe(0.48)
  expect(style.textContent).toBe(cssBefore)
})
