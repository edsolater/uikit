// @vitest-environment jsdom

/** 验证 Button 的公开行为、DOM 描述与应用启动职责边界。 */
import { render } from 'solid-js/web'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createState } from '../../../hooks'
import { Button, buttonDefaultPropSettings, type ButtonAppearance } from './Button'
import { cssRoot } from '../../../style-system'

let dispose: (() => void) | undefined

// DOM 行为留在 jsdom，CSSOM 的实际注册由相邻浏览器用例验证。
beforeEach(() => {
  vi.spyOn(cssRoot, 'mount').mockReturnValue(cssRoot)
})

afterEach(() => {
  dispose?.()
  dispose = undefined
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

describe('Button', () => {
  test('省略外观保持原始 undefined，通过公开表生成 DOM 外观', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Button>默认</Button>, host)
    expect((host.firstElementChild as HTMLElement).dataset.appearance).toBe('outlined')
    dispose()
    host.replaceChildren()
    Object.assign(buttonDefaultPropSettings.appearance, { undefined: 'filled' })
    try {
      dispose = render(() => <Button>配置后</Button>, host)
      expect((host.firstElementChild as HTMLElement).dataset.appearance).toBe('filled')
    } finally {
      Object.assign(buttonDefaultPropSettings.appearance, { undefined: 'outlined' })
    }
  })

  test('外观字段接管描述词，动态 undefined 使用转换表且未配置候选保持原样', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const appearance = createState<ButtonAppearance | undefined>()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Button plain appearance={appearance}>确认</Button>, host)
    const element = host.firstElementChild as HTMLElement
    expect(element.dataset.appearance).toBe('outlined')
    appearance.set('filled')
    expect(element.dataset.appearance).toBe('filled')
    appearance.set('plain')
    expect(element.dataset.appearance).toBe('plain')
    appearance.set(undefined)
    expect(element.dataset.appearance).toBe('outlined')
    expect(element.hasAttribute('data-variant')).toBe(false)
  })

  test('外观确定描述词为 false 时通过省略值映射，outlined 也可显式声明', () => {
    const filled = createState(false)
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <><Button filled={filled}>切换</Button><Button outlined>明确</Button></>, host)
    const [first, second] = host.querySelectorAll('button')
    expect(first.dataset.appearance).toBe('outlined')
    expect(second.dataset.appearance).toBe('outlined')
    filled.set(true)
    expect(first.dataset.appearance).toBe('filled')
    filled.set(false)
    expect(first.dataset.appearance).toBe('outlined')
  })

  test('组件渲染与 ref 回调不触发全局样式编译挂载', () => {
    const host = document.body.appendChild(document.createElement('div'))
    const ref = vi.fn()

    dispose = render(
      () => (
        <>
          <Button ref={ref}>一</Button>
          <Button>二</Button>
          <Button>三</Button>
        </>
      ),
      host,
    )

    expect(cssRoot.mount).not.toHaveBeenCalled()
    expect(ref).toHaveBeenCalledOnce()
    expect(ref).toHaveBeenCalledWith(host.firstElementChild)
  })

  test('把自身的 onClick 动作翻译成底层 click 事件', () => {
    const host = document.body.appendChild(document.createElement('div'))
    const onClick = vi.fn()
    dispose = render(() => <Button onClick={onClick}>确认</Button>, host)
    const element = host.firstElementChild as HTMLButtonElement

    element.click()

    expect(onClick).toHaveBeenCalledOnce()
  })

  test('分组字段形成外观、强调、语气和尺寸描述，退出旧 variant 属性', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <Button size="small" appearance="filled" emphasis="strong" tone="danger">
          保存
        </Button>
      ),
      host,
    )
    const element = host.firstElementChild as HTMLButtonElement

    expect(element.getAttribute('data-size')).toBe('small')
    expect(element.getAttribute('data-appearance')).toBe('filled')
    expect(element.getAttribute('data-emphasis')).toBe('strong')
    expect(element.getAttribute('data-tone')).toBe('danger')
    expect(element.hasAttribute('data-variant')).toBe(false)
    for (const name of ['appearance', 'emphasis', 'tone', 'strong', 'danger']) expect(element.hasAttribute(name)).toBe(false)
  })

  test('确定描述词独立组合 danger 与 strong，并保留 plain 外观', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Button plain danger strong>删除</Button>, host)
    const element = host.firstElementChild as HTMLButtonElement
    expect(element.dataset.appearance).toBe('plain')
    expect(element.dataset.emphasis).toBe('strong')
    expect(element.dataset.tone).toBe('danger')
    expect(element.hasAttribute('data-variant')).toBe(false)
  })

  test('emphasis 持续响应变化，显式 undefined 接管分组而不回落 soft', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const emphasis = createState<'soft' | 'strong' | undefined>()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Button soft emphasis={emphasis}>确认</Button>, host)
    const element = host.firstElementChild as HTMLButtonElement
    expect(element.hasAttribute('data-emphasis')).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('“emphasis”接管整个分组'))
    emphasis.set('strong')
    expect(element.dataset.emphasis).toBe('strong')
    emphasis.set('soft')
    expect(element.dataset.emphasis).toBe('soft')
    emphasis.set(undefined)
    expect(element.hasAttribute('data-emphasis')).toBe(false)
  })

  test('不定字段一旦声明便接管分组，undefined 不回落到确定描述词', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const size = createState<'small' | 'large' | 'xlarge' | undefined>()
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <Button small size={size}>
          保存
        </Button>
      ),
      host,
    )
    const element = host.firstElementChild as HTMLButtonElement

    expect(element.hasAttribute('data-size')).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('不定字段“size”'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('“size”接管整个分组'))

    size.set('large')
    expect(element.getAttribute('data-size')).toBe('large')
  })

  test('多个确定描述词只警告并按定义顺序产生稳定结果', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <Button small large>
          保存
        </Button>
      ),
      host,
    )
    const element = host.firstElementChild as HTMLButtonElement

    expect(element.getAttribute('data-size')).toBe('small')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('“small”、“large”'))
  })

  test('确定描述词的响应式布尔值只改变它是否存在', () => {
    const small = createState(false)
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Button small={small}>保存</Button>, host)
    const element = host.firstElementChild as HTMLButtonElement

    expect(element.hasAttribute('data-size')).toBe(false)

    small.set(true)
    expect(element.getAttribute('data-size')).toBe('small')
  })

  test('多个 Status 同时成立，并由 effect 补充原生状态', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <Button loading disabled>
          保存中
        </Button>
      ),
      host,
    )
    const element = host.firstElementChild as HTMLButtonElement

    expect(element.getAttribute('data-status')).toBe('loading disabled')
    expect(element.disabled).toBe(true)
    expect(element.getAttribute('aria-busy')).toBe('true')
  })

  test('外部 Status Source 的后续变化持续进入 effect 建立的声明', () => {
    const loading = createState(false)
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <Button loading={loading}>保存</Button>, host)
    const element = host.firstElementChild as HTMLButtonElement

    expect(element.hasAttribute('data-status')).toBe(false)
    expect(element.hasAttribute('aria-busy')).toBe(false)

    loading.set(true)
    expect(element.getAttribute('data-status')).toBe('loading')
    expect(element.getAttribute('aria-busy')).toBe('true')
  })
})
