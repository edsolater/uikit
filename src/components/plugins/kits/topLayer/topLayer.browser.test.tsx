import { render } from 'solid-js/web'
import { afterEach, describe, expect, test } from 'vitest'
import { val } from '../../../../hooks'
import { Piv } from '../../../Piv'
import { usePlugin } from '../../usePlugin'
import { enterTopLayer, topLayer, type TopLayerController } from './topLayer'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

describe('topLayer', () => {
  test('Plugin 在原 DOM 上进入和退出完整提升事务', () => {
    let controller!: TopLayerController
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => {
      const [plugin, currentController] = usePlugin(topLayer)
      controller = currentController
      return <Piv plugin={plugin} htmlProps={{ 'data-testid': 'source' }} />
    }, host)

    const source = document.querySelector<HTMLElement>('[data-testid="source"]')!
    expect(source.parentElement).toBe(host)
    expect(source.getAttribute('popover')).toBe('manual')
    expect(source.matches(':popover-open')).toBe(true)
    expect(source.getAttribute('data-top-layer')).toBe('true')
    expect(document.querySelector('.top-layer-anchor')).not.toBeNull()
    expect(val(controller.active)).toBe(true)

    controller.leave()
    expect(source.hasAttribute('popover')).toBe(false)
    expect(source.matches(':popover-open')).toBe(false)
    expect(source.hasAttribute('data-top-layer')).toBe(false)
    expect(document.querySelector('.top-layer-anchor')).toBeNull()
    expect(val(controller.active)).toBe(false)

    controller.enter()
    expect(source.matches(':popover-open')).toBe(true)
    expect(source.getAttribute('data-top-layer')).toBe('true')
    expect(document.querySelector('.top-layer-anchor')).not.toBeNull()
    expect(val(controller.active)).toBe(true)
  })

  test('命令式提升维护原位置、尺寸、视觉和来源声明', () => {
    const source = document.body.appendChild(document.createElement('div'))
    source.textContent = '保存'
    source.style.width = '160px'
    source.style.height = '80px'
    source.style.display = 'grid'
    source.style.right = '7px'
    source.style.marginRight = '13px'
    source.style.minInlineSize = '20px'
    source.style.maxInlineSize = '240px'
    source.style.border = '3px solid rgb(12 34 56)'
    source.style.padding = '17px'
    source.style.borderRadius = '12px 16px 20px 24px'
    source.style.color = 'rgb(21 43 65)'
    source.style.background = 'rgb(98 76 54)'

    const originalRect = source.getBoundingClientRect()
    const originalLayoutSize = { width: source.offsetWidth, height: source.offsetHeight }
    const originalVisualStyle = readVisualStyle(source)
    const entry = enterTopLayer(source)
    const anchor = document.querySelector<HTMLElement>('.top-layer-anchor')!
    const elevatedRect = source.getBoundingClientRect()

    expect(source.matches(':popover-open')).toBe(true)
    expect(source.getAttribute('data-top-layer')).toBe('true')
    expect(getComputedStyle(source).position).toBe('fixed')
    expect(getComputedStyle(source).boxShadow).not.toBe('none')
    expect(source.style.right).toBe('auto')
    expect(source.style.display).toBe('grid')
    expect(source.style.marginRight).toBe('13px')
    expect(source.style.minInlineSize).toBe('20px')
    expect(source.style.maxInlineSize).toBe('240px')
    expect(readVisualStyle(source)).toEqual(originalVisualStyle)
    expect(anchor.parentElement).toBe(source.parentElement)
    expect(anchor.nextElementSibling).toBe(source)
    expect(anchor.childElementCount).toBe(0)
    expect(anchor.textContent).toBe('')
    expect(Math.abs(elevatedRect.left - originalRect.left)).toBeLessThan(0.1)
    expect(Math.abs(elevatedRect.top - originalRect.top)).toBeLessThan(0.1)
    expect(Math.abs(elevatedRect.width - originalRect.width)).toBeLessThan(0.1)
    expect(Math.abs(elevatedRect.height - originalRect.height)).toBeLessThan(0.1)
    expect(Math.abs(anchor.getBoundingClientRect().width - originalLayoutSize.width))
      .toBeLessThan(0.1)
    expect(Math.abs(anchor.getBoundingClientRect().height - originalLayoutSize.height))
      .toBeLessThan(0.1)
    const anchorName = anchor.style.getPropertyValue('anchor-name')
    expect(anchorName).toMatch(/^--uikit-top-layer-anchor-/)
    expect(source.style.inlineSize).toBe(`anchor-size(${anchorName} self-inline)`)
    expect(source.style.blockSize).toBe(`anchor-size(${anchorName} self-block)`)
    expect(anchor.style.borderTopLeftRadius).toBe('12px')
    expect(anchor.style.borderTopRightRadius).toBe('16px')
    expect(anchor.style.borderBottomRightRadius).toBe('20px')
    expect(anchor.style.borderBottomLeftRadius).toBe('24px')

    entry.leave()
    expect(source.hasAttribute('popover')).toBe(false)
    expect(source.hasAttribute('data-top-layer')).toBe(false)
    expect(document.querySelector('.top-layer-anchor')).toBeNull()
    expect(source.style.position).toBe('')
    expect(source.style.right).toBe('7px')
    expect(source.style.display).toBe('grid')
    expect(source.style.marginRight).toBe('13px')
    expect(source.style.minInlineSize).toBe('20px')
    expect(source.style.maxInlineSize).toBe('240px')
  })

  test('Anchor 保留 Grid stretch 得到的外框', () => {
    const grid = document.body.appendChild(document.createElement('div'))
    grid.style.display = 'grid'
    grid.style.gridTemplateColumns = 'minmax(0, 1fr)'
    grid.style.gridAutoRows = '96px'
    grid.style.width = '640px'
    const source = grid.appendChild(document.createElement('div'))
    source.textContent = 'Weather'
    const originalRect = source.getBoundingClientRect()

    const entry = enterTopLayer(source)
    const elevatedRect = source.getBoundingClientRect()
    const anchor = document.querySelector<HTMLElement>('.top-layer-anchor')!

    expect(Math.abs(elevatedRect.left - originalRect.left)).toBeLessThan(0.1)
    expect(Math.abs(elevatedRect.top - originalRect.top)).toBeLessThan(0.1)
    expect(Math.abs(elevatedRect.width - originalRect.width)).toBeLessThan(0.1)
    expect(Math.abs(elevatedRect.height - originalRect.height)).toBeLessThan(0.1)
    expect(Math.abs(anchor.getBoundingClientRect().width - originalRect.width)).toBeLessThan(0.1)
    expect(Math.abs(anchor.getBoundingClientRect().height - originalRect.height)).toBeLessThan(0.1)

    entry.leave()
  })

  test('滚动时 Anchor 跟随原布局，提升元素留在视口坐标', () => {
    const scroller = document.body.appendChild(document.createElement('div'))
    scroller.style.blockSize = '80px'
    scroller.style.overflow = 'auto'
    const content = scroller.appendChild(document.createElement('div'))
    content.style.height = '300px'
    content.style.paddingTop = '120px'
    const source = content.appendChild(document.createElement('div'))
    source.style.width = '120px'
    source.style.height = '40px'

    const entry = enterTopLayer(source)
    const anchor = document.querySelector<HTMLElement>('.top-layer-anchor')!
    const sourceTop = source.getBoundingClientRect().top
    const anchorTop = anchor.getBoundingClientRect().top

    scroller.scrollTop = 40
    scroller.dispatchEvent(new Event('scroll'))

    expect(Math.abs(source.getBoundingClientRect().top - sourceTop)).toBeLessThan(0.1)
    expect(Math.abs(anchor.getBoundingClientRect().top - (anchorTop - 40))).toBeLessThan(0.1)

    entry.leave()
  })

  test('命令式入口不覆盖已有 Popover', () => {
    const source = document.body.appendChild(document.createElement('div'))
    source.setAttribute('popover', 'manual')

    expect(() => enterTopLayer(source))
      .toThrowError('Top Layer 元素不能同时承担 Popover')
    expect(source.getAttribute('popover')).toBe('manual')
    expect(document.querySelector('.top-layer-anchor')).toBeNull()
  })
})

function readVisualStyle(element: HTMLElement) {
  const style = getComputedStyle(element)
  return {
    display: style.display,
    border: style.border,
    padding: style.padding,
    backgroundColor: style.backgroundColor,
    color: style.color,
  }
}
