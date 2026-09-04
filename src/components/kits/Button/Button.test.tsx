// @vitest-environment jsdom

/** 验证 Button 的公开行为、DOM 描述与样式挂载。 */
import { render } from 'solid-js/web'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createState } from '../../../hooks'
import { cssBlocks } from '../../../style-utils'
import { Button } from './Button'
import { buttonStyleURL } from './Button.style'

let dispose: (() => void) | undefined
const buttonStyleSelector = 'style[data-uikit-css="' + buttonStyleURL + '"]'

afterEach(() => {
  dispose?.()
  dispose = undefined
  vi.restoreAllMocks()
  document.body.replaceChildren()
  document.head.querySelectorAll(buttonStyleSelector).forEach((element) => element.remove())
})

describe('Button', () => {
  test('组件样式不向通用 registry 注册 Button 业务 blocks', () => {
    expect(cssBlocks.buttonFoundation).toBeUndefined()
    expect(cssBlocks.buttonDisabled).toBeUndefined()
    expect(cssBlocks.buttonTone).toBeUndefined()
  })

  test('同一 Document 中的多个 Button 只插入一次组件样式', () => {
    const host = document.body.appendChild(document.createElement('div'))
    const append = vi.spyOn(document.head, 'append')
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

    expect(document.head.querySelectorAll(buttonStyleSelector)).toHaveLength(1)
    expect(append).toHaveBeenCalledOnce()
    expect(ref).toHaveBeenCalledOnce()
    expect(append.mock.invocationCallOrder[0]).toBeLessThan(ref.mock.invocationCallOrder[0])
    expect(ref).toHaveBeenCalledWith(host.firstElementChild)
    const cssText = document.head.querySelector(buttonStyleSelector)?.textContent
    expect(cssText).toContain(".Button[data-size='small']")
    expect(cssText).toContain('var(--color-surface)')
    expect(cssText).not.toContain('[object Object]')
  })

  test('把自身的 onClick 动作翻译成底层 click 事件', () => {
    const host = document.body.appendChild(document.createElement('div'))
    const onClick = vi.fn()
    dispose = render(() => <Button onClick={onClick}>确认</Button>, host)
    const element = host.firstElementChild as HTMLButtonElement

    element.click()

    expect(onClick).toHaveBeenCalledOnce()
  })

  test('分组字段形成 variant、tone 和 size 的 DOM 描述', () => {
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <Button size="small" variant="solid" tone="accent">
          保存
        </Button>
      ),
      host,
    )
    const element = host.firstElementChild as HTMLButtonElement

    expect(element.getAttribute('data-size')).toBe('small')
    expect(element.getAttribute('data-variant')).toBe('solid')
    expect(element.getAttribute('data-tone')).toBe('accent')
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
