import { render } from '@solidjs/web'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { cssRoot } from '@/style-system'
import { val } from '@/foundation'
import { Piv } from '../../../Piv/Piv'
import { usePlugin } from '../../usePlugin'
import {
  createTopLayerController,
  topLayer,
  type TopLayerController,
} from './topLayer'

let dispose: (() => void) | undefined
let styleHost: HTMLStyleElement

beforeEach(() => {
  styleHost = document.head.appendChild(document.createElement('style'))
  styleHost.id = 'css-root'
  cssRoot.mount()
})

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  styleHost.remove()
})

describe('topLayer', () => {
  test('定位框边界使用响应浅深主题的材料', () => {
    const root = document.documentElement
    const previous = root.getAttribute('data-theme')
    const source = document.body.appendChild(document.createElement('div'))
    source.style.cssText = 'width:40px;height:40px'
    const controller = createTopLayerController(source)
    try {
      root.dataset.theme = 'light'
      controller.enter()
      const anchor = document.querySelector<HTMLElement>('.top-layer-anchor')!
      const light = getComputedStyle(anchor, '::after').borderTopColor
      root.dataset.theme = 'dark'
      expect(getComputedStyle(anchor, '::after').borderTopColor).not.toBe(light)
    } finally {
      controller.leave()
      if (previous === null) root.removeAttribute('data-theme')
      else root.setAttribute('data-theme', previous)
    }
  })

  test('定位框边界保留不同定位方式的几何与圆角', () => {
    for (const position of ['static', 'relative', 'absolute', 'fixed']) {
      const host = document.body.appendChild(document.createElement('div'))
      host.style.cssText = 'position:relative;width:300px;height:150px'
      const source = host.appendChild(document.createElement('div'))
      source.style.cssText = `position:${position};width:80px;height:40px;border-radius:12px;left:10px;top:7px`
      const before = source.getBoundingClientRect()
      const controller = createTopLayerController(source)
      controller.enter()
      const anchor = host.querySelector<HTMLElement>('.top-layer-anchor')!
      const after = anchor.getBoundingClientRect()
      const outline = getComputedStyle(anchor, '::after')
      expect(Math.abs(after.left - before.left), position).toBeLessThan(0.1)
      expect(Math.abs(after.top - before.top), position).toBeLessThan(0.1)
      expect(Math.abs(after.width - before.width), position).toBeLessThan(0.1)
      expect(Math.abs(after.height - before.height), position).toBeLessThan(0.1)
      expect(outline.borderStyle).toBe('dashed')
      expect(outline.borderWidth).toBe('2px')
      expect(outline.borderRadius).toBe('12px')
      controller.leave()
      host.remove()
    }
  })

  test('提升阴影继承祖先配置，缺省时使用共享初值', () => {
    const host = document.body.appendChild(document.createElement('div'))
    const source = host.appendChild(document.createElement('div'))
    source.className = 'top-layer'
    expect(getComputedStyle(source).boxShadow).toContain('16px 32px')
    host.style.setProperty('--top-layer-shadow', 'rgb(1, 2, 3) 1px 2px 3px')
    expect(getComputedStyle(source).boxShadow).toBe('rgb(1, 2, 3) 1px 2px 3px 0px')
  })

  test('挂载前只记录最后意图，挂载后建立提升资源，卸载释放 DOM 资源', async () => {
    for (const requested of [false, true]) {
      let controller!: TopLayerController
      const host = document.body.appendChild(document.createElement('div'))

      dispose = render(() => {
        const [plugin, currentController] = usePlugin(topLayer)
        controller = currentController
        return (
          <Piv
            htmlProps={{ 'data-testid': 'source' }}
            plugin={(context) => {
              const props = plugin(context)
              expect(context.element.isConnected).toBe(false)
              controller.leave()
              controller.enter()
              if (!requested) controller.leave()
              expect(context.element.hasAttribute('popover')).toBe(false)
              expect(context.element.classList.contains('top-layer')).toBe(
                false,
              )
              expect(context.element.previousElementSibling).toBeNull()
              expect(document.querySelector('.top-layer-anchor')).toBeNull()
              return props
            }}
          />
        )
      }, host)

      const source = host.querySelector<HTMLElement>('[data-testid="source"]')!
      expect(source.matches(':popover-open')).toBe(requested)
      expect(source.classList.contains('top-layer')).toBe(requested)
      expect(document.querySelectorAll('.top-layer-anchor')).toHaveLength(
        requested ? 1 : 0,
      )
      await expect.poll(() => val(controller.active)).toBe(requested)

      dispose()
      dispose = undefined
      expect(source.matches(':popover-open')).toBe(false)
      expect(document.querySelector('.top-layer-anchor')).toBeNull()
      host.remove()
    }
  })

  test('直接安装 Plugin 时在组件挂载期间持续提升', () => {
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(
      () => <Piv plugin={topLayer} htmlProps={{ 'data-testid': 'source' }} />,
      host,
    )

    const source = document.querySelector<HTMLElement>(
      '[data-testid="source"]',
    )!
    expect(source.matches(':popover-open')).toBe(true)
    expect(source.classList.contains('top-layer')).toBe(true)
    expect(document.querySelector('.top-layer-anchor')).not.toBeNull()
    expect(getComputedStyle(source).boxShadow).not.toBe('none')

    dispose()
    dispose = undefined
    expect(source.matches(':popover-open')).toBe(false)
    expect(source.classList.contains('top-layer')).toBe(false)
    expect(document.querySelector('.top-layer-anchor')).toBeNull()
  })

  test('Plugin Controller 条件控制同一项提升能力', async () => {
    let controller!: TopLayerController
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => {
      const [plugin, currentController] = usePlugin(topLayer)
      controller = currentController
      return <Piv plugin={plugin} htmlProps={{ 'data-testid': 'source' }} />
    }, host)

    const source = document.querySelector<HTMLElement>(
      '[data-testid="source"]',
    )!
    expect(source.parentElement).toBe(host)
    expect(source.getAttribute('popover')).toBe('manual')
    expect(source.matches(':popover-open')).toBe(true)
    expect(source.classList.contains('top-layer')).toBe(true)
    expect(document.querySelector('.top-layer-anchor')).not.toBeNull()
    await expect.poll(() => val(controller.active)).toBe(true)

    controller.leave()
    expect(source.hasAttribute('popover')).toBe(false)
    expect(source.matches(':popover-open')).toBe(false)
    expect(source.classList.contains('top-layer')).toBe(false)
    expect(document.querySelector('.top-layer-anchor')).toBeNull()
    await expect.poll(() => val(controller.active)).toBe(false)

    controller.enter()
    expect(source.matches(':popover-open')).toBe(true)
    expect(source.classList.contains('top-layer')).toBe(true)
    expect(document.querySelector('.top-layer-anchor')).not.toBeNull()
    await expect.poll(() => val(controller.active)).toBe(true)
  })

  test('命令式提升维护原位置、尺寸、视觉和来源声明', async () => {
    const host = document.body.appendChild(document.createElement('div'))
    host.style.setProperty('--color-line', 'rgb(12 34 56 / 28%)')
    host.style.setProperty('--color-surface-low', 'rgb(240 240 240)')
    const source = host.appendChild(document.createElement('div'))
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
    source.style.setProperty('corner-shape', 'squircle')
    source.style.color = 'rgb(21 43 65)'
    source.style.background = 'rgb(98 76 54)'

    const originalRect = source.getBoundingClientRect()
    const originalLayoutSize = {
      width: source.offsetWidth,
      height: source.offsetHeight,
    }
    const originalVisualStyle = readVisualStyle(source)
    const controller = createTopLayerController(source)
    await expect.poll(() => val(controller.active)).toBe(false)
    expect(document.querySelector('.top-layer-anchor')).toBeNull()

    controller.enter()
    const anchor = document.querySelector<HTMLElement>('.top-layer-anchor')!
    const elevatedRect = source.getBoundingClientRect()

    expect(source.matches(':popover-open')).toBe(true)
    await expect.poll(() => val(controller.active)).toBe(true)
    expect(source.classList.contains('top-layer')).toBe(true)
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
    expect(getComputedStyle(anchor, '::after').borderStyle).toBe('dashed')
    expect(getComputedStyle(anchor, '::after').borderRadius).toBe(getComputedStyle(anchor).borderRadius)
    expect(Math.abs(elevatedRect.left - originalRect.left)).toBeLessThan(0.1)
    expect(Math.abs(elevatedRect.top - originalRect.top)).toBeLessThan(0.1)
    expect(Math.abs(elevatedRect.width - originalRect.width)).toBeLessThan(0.1)
    expect(Math.abs(elevatedRect.height - originalRect.height)).toBeLessThan(
      0.1,
    )
    expect(
      Math.abs(anchor.getBoundingClientRect().width - originalLayoutSize.width),
    ).toBeLessThan(0.1)
    expect(
      Math.abs(
        anchor.getBoundingClientRect().height - originalLayoutSize.height,
      ),
    ).toBeLessThan(0.1)
    const anchorName = anchor.style.getPropertyValue('anchor-name')
    expect(anchorName).toMatch(/^--uikit-top-layer-anchor-/)
    expect(source.style.inlineSize).toBe(
      `anchor-size(${anchorName} self-inline)`,
    )
    expect(source.style.blockSize).toBe(`anchor-size(${anchorName} self-block)`)
    expect(anchor.style.borderTopLeftRadius).toBe('12px')
    expect(anchor.style.borderTopRightRadius).toBe('16px')
    expect(anchor.style.borderBottomRightRadius).toBe('20px')
    expect(anchor.style.borderBottomLeftRadius).toBe('24px')
    expect(anchor.style.getPropertyValue('corner-top-left-shape')).toBe(
      getComputedStyle(source).getPropertyValue('corner-top-left-shape'),
    )

    controller.leave()
    await expect.poll(() => val(controller.active)).toBe(false)
    expect(source.hasAttribute('popover')).toBe(false)
    expect(source.classList.contains('top-layer')).toBe(false)
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

    const controller = createTopLayerController(source)
    controller.enter()
    const elevatedRect = source.getBoundingClientRect()
    const anchor = document.querySelector<HTMLElement>('.top-layer-anchor')!

    expect(Math.abs(elevatedRect.left - originalRect.left)).toBeLessThan(0.1)
    expect(Math.abs(elevatedRect.top - originalRect.top)).toBeLessThan(0.1)
    expect(Math.abs(elevatedRect.width - originalRect.width)).toBeLessThan(0.1)
    expect(Math.abs(elevatedRect.height - originalRect.height)).toBeLessThan(
      0.1,
    )
    expect(
      Math.abs(anchor.getBoundingClientRect().width - originalRect.width),
    ).toBeLessThan(0.1)
    expect(
      Math.abs(anchor.getBoundingClientRect().height - originalRect.height),
    ).toBeLessThan(0.1)

    controller.leave()
  })

  test('Anchor 不把 Grid stretch 的结果固化成下一轮轨道输入', () => {
    const detail = document.body.appendChild(document.createElement('div'))
    detail.style.display = 'grid'
    detail.style.width = '640px'
    detail.style.height = '560px'
    detail.appendChild(document.createElement('div')).textContent = '返回'

    const panel = detail.appendChild(document.createElement('div'))
    panel.style.display = 'grid'
    panel.style.gap = '16px'
    panel.style.padding = '24px'
    panel.appendChild(document.createElement('div')).textContent = 'Draggable'
    panel.appendChild(document.createElement('p')).textContent = '拖动原始元素'

    const source = panel.appendChild(document.createElement('div'))
    source.textContent = 'Weather'
    source.style.minHeight = '108px'

    const originalPanelRect = panel.getBoundingClientRect()
    const originalSourceRect = source.getBoundingClientRect()
    const controller = createTopLayerController(source)
    controller.enter()
    const anchor = document.querySelector<HTMLElement>('.top-layer-anchor')!
    const elevatedPanelRect = panel.getBoundingClientRect()
    const anchorRect = anchor.getBoundingClientRect()

    expect(
      Math.abs(elevatedPanelRect.top - originalPanelRect.top),
    ).toBeLessThan(0.1)
    expect(
      Math.abs(elevatedPanelRect.height - originalPanelRect.height),
    ).toBeLessThan(0.1)
    expect(Math.abs(anchorRect.top - originalSourceRect.top)).toBeLessThan(0.1)
    expect(
      Math.abs(anchorRect.height - originalSourceRect.height),
    ).toBeLessThan(0.1)

    controller.leave()
  })

  test('Anchor 继续按照原 flex 参数分配主轴空间', () => {
    const flex = document.body.appendChild(document.createElement('div'))
    flex.style.display = 'flex'
    flex.style.width = '600px'
    const source = flex.appendChild(document.createElement('div'))
    const peer = flex.appendChild(document.createElement('div'))
    source.textContent = 'Weather'
    peer.textContent = 'Calendar'
    source.style.flex = '1'
    peer.style.flex = '1'

    const originalSourceRect = source.getBoundingClientRect()
    const originalPeerRect = peer.getBoundingClientRect()
    const controller = createTopLayerController(source)
    controller.enter()
    const anchor = document.querySelector<HTMLElement>('.top-layer-anchor')!
    const anchorRect = anchor.getBoundingClientRect()
    const currentPeerRect = peer.getBoundingClientRect()

    expect(Math.abs(anchorRect.width - originalSourceRect.width)).toBeLessThan(
      0.1,
    )
    expect(Math.abs(currentPeerRect.left - originalPeerRect.left)).toBeLessThan(
      0.1,
    )
    expect(
      Math.abs(currentPeerRect.width - originalPeerRect.width),
    ).toBeLessThan(0.1)

    controller.leave()
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

    const controller = createTopLayerController(source)
    controller.enter()
    const anchor = document.querySelector<HTMLElement>('.top-layer-anchor')!
    const sourceTop = source.getBoundingClientRect().top
    const anchorTop = anchor.getBoundingClientRect().top

    scroller.scrollTop = 40
    scroller.dispatchEvent(new Event('scroll'))

    expect(
      Math.abs(source.getBoundingClientRect().top - sourceTop),
    ).toBeLessThan(0.1)
    expect(
      Math.abs(anchor.getBoundingClientRect().top - (anchorTop - 40)),
    ).toBeLessThan(0.1)

    controller.leave()
  })

  test('纯控制器不覆盖已有 Popover', () => {
    const source = document.body.appendChild(document.createElement('div'))
    source.setAttribute('popover', 'manual')
    const controller = createTopLayerController(source)

    expect(() => controller.enter()).toThrowError(
      'Top Layer 元素不能同时承担 Popover',
    )
    expect(val(controller.active)).toBe(false)
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
