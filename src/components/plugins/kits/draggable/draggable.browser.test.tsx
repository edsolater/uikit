import { render } from 'solid-js/web'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { val } from '../../../../hooks'
import { Piv } from '../../../Piv'
import { usePlugin } from '../../usePlugin'
import { createPointerDrag } from './createPointerDrag'
import { draggable, type DraggableController } from './draggable'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('draggable', () => {
  test('移动原始 source，并只在原位置创建空几何 Placeholder', () => {
    let controller!: DraggableController
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => {
      const [plugin, currentController] = usePlugin(draggable, {
        payload: 'weather',
        activationDistance: 0,
      })
      controller = currentController
      return (
        <Piv
          plugin={plugin}
          style={{
            width: '160px',
            height: '80px',
            'border-radius': '12px 16px 20px 24px',
            transform: 'rotate(1deg)',
          }}
          htmlProps={{ 'data-testid': 'source' }}
        >
          <span>Weather</span>
        </Piv>
      )
    }, host)

    const source = document.querySelector<HTMLElement>('[data-testid="source"]')!
    const sourceIdentity = source
    source.style.right = '7px'
    source.style.marginRight = '13px'
    source.style.backgroundPositionX = '25%'
    const originalRect = source.getBoundingClientRect()
    const originalLayoutSize = {
      width: source.offsetWidth,
      height: source.offsetHeight,
    }
    stubPointerCapture(source)
    source.dispatchEvent(pointerEvent('pointerdown', 7, 20, 30))

    const placeholder = document.querySelector<HTMLElement>('.drag-placeholder')!
    const sourceRect = source.getBoundingClientRect()
    expect(source.draggable).toBe(false)
    expect(source.getAttribute('data-dragging')).toBe('true')
    expect(source.getAttribute('popover')).toBe('manual')
    expect(source.matches(':popover-open')).toBe(true)
    expect(getComputedStyle(source).position).toBe('fixed')
    expect(document.querySelector('[data-testid="source"]')).toBe(sourceIdentity)
    expect(document.querySelectorAll('[data-testid="source"]')).toHaveLength(1)
    expect(source.style.getPropertyValue('--drag-x')).toBe('0px')
    expect(source.style.getPropertyValue('--drag-y')).toBe('0px')
    expect(getComputedStyle(source).translate).toBe('0px')
    expect(source.style.transform).toBe('rotate(1deg)')
    expect(getComputedStyle(source).visibility).not.toBe('hidden')
    expect(getComputedStyle(source).pointerEvents).toBe('none')
    expect(getComputedStyle(source).boxShadow).not.toBe('none')
    expect(placeholder.parentElement).toBe(source.parentElement)
    expect(placeholder.nextElementSibling).toBe(source)
    expect(getComputedStyle(placeholder).position).not.toBe('fixed')
    expect(placeholder.childElementCount).toBe(0)
    expect(placeholder.textContent).toBe('')
    expect(Math.abs(sourceRect.left - originalRect.left)).toBeLessThan(0.1)
    expect(Math.abs(sourceRect.top - originalRect.top)).toBeLessThan(0.1)
    expect(Math.abs(sourceRect.width - originalRect.width)).toBeLessThan(0.1)
    expect(Math.abs(sourceRect.height - originalRect.height)).toBeLessThan(0.1)
    expect(Math.abs(placeholder.getBoundingClientRect().width - originalLayoutSize.width))
      .toBeLessThan(0.1)
    expect(Math.abs(placeholder.getBoundingClientRect().height - originalLayoutSize.height))
      .toBeLessThan(0.1)
    const anchorName = placeholder.style.getPropertyValue('anchor-name')
    expect(anchorName).toMatch(/^--uikit-drag-placeholder-/)
    expect(source.style.inlineSize).toBe(`anchor-size(${anchorName} self-inline)`)
    expect(source.style.blockSize).toBe(`anchor-size(${anchorName} self-block)`)
    expect(placeholder.style.borderTopLeftRadius).toBe('12px')
    expect(placeholder.style.borderTopRightRadius).toBe('16px')
    expect(placeholder.style.borderBottomRightRadius).toBe('20px')
    expect(placeholder.style.borderBottomLeftRadius).toBe('24px')
    expect(val(controller.dragging)).toBe(true)

    window.dispatchEvent(pointerEvent('pointermove', 7, 52, 74))
    expect(source.style.getPropertyValue('--drag-x')).toBe('32px')
    expect(source.style.getPropertyValue('--drag-y')).toBe('44px')
    expect(getComputedStyle(source).translate).toBe('32px 44px')
    expect(document.querySelector('[data-testid="source"]')).toBe(sourceIdentity)

    window.dispatchEvent(pointerEvent('pointerup', 7, 52, 74))
    expect(document.querySelector('.drag-placeholder')).toBeNull()
    expect(source.style.getPropertyValue('--drag-x')).toBe('')
    expect(source.style.getPropertyValue('--drag-y')).toBe('')
    expect(getComputedStyle(source).translate).toBe('none')
    expect(source.hasAttribute('data-dragging')).toBe(false)
    expect(source.hasAttribute('popover')).toBe(false)
    expect(source.matches(':popover-open')).toBe(false)
    expect(source.style.position).toBe('')
    expect(source.style.right).toBe('7px')
    expect(source.style.marginRight).toBe('13px')
    expect(source.style.backgroundPositionX).toBe('25%')
    expect(val(controller.dragging)).toBe(false)
  })

  test('默认在移动超过激活距离后才开始拖动', () => {
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => (
      <Piv
        plugin={draggable({ payload: 'weather' })}
        htmlProps={{ 'data-testid': 'source' }}
      />
    ), host)

    const source = document.querySelector<HTMLElement>('[data-testid="source"]')!
    stubPointerCapture(source)
    source.dispatchEvent(pointerEvent('pointerdown', 8, 0, 0))
    window.dispatchEvent(pointerEvent('pointermove', 8, 3, 4))
    expect(document.querySelector('.drag-placeholder')).toBeNull()

    window.dispatchEvent(pointerEvent('pointermove', 8, 6, 4))
    expect(document.querySelector('.drag-placeholder')).not.toBeNull()
  })

  test('通过 Placeholder anchor-size 保留 Grid stretch 得到的外框', () => {
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => (
      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'minmax(0, 1fr)',
          'grid-auto-rows': '96px',
          width: '640px',
        }}
      >
        <Piv
          plugin={draggable({ payload: 'weather', activationDistance: 0 })}
          htmlProps={{ 'data-testid': 'grid-source' }}
        >
          Weather
        </Piv>
      </div>
    ), host)

    const source = document.querySelector<HTMLElement>('[data-testid="grid-source"]')!
    const originalRect = source.getBoundingClientRect()
    stubPointerCapture(source)
    source.dispatchEvent(pointerEvent('pointerdown', 14, 20, 30))

    const draggedRect = source.getBoundingClientRect()
    const placeholder = document.querySelector<HTMLElement>('.drag-placeholder')!
    expect(source.matches(':popover-open')).toBe(true)
    expect(source.style.inlineSize).toContain('anchor-size(')
    expect(Math.abs(draggedRect.left - originalRect.left)).toBeLessThan(0.1)
    expect(Math.abs(draggedRect.top - originalRect.top)).toBeLessThan(0.1)
    expect(Math.abs(draggedRect.width - originalRect.width)).toBeLessThan(0.1)
    expect(Math.abs(draggedRect.height - originalRect.height)).toBeLessThan(0.1)
    expect(Math.abs(placeholder.getBoundingClientRect().width - originalRect.width))
      .toBeLessThan(0.1)
    expect(Math.abs(placeholder.getBoundingClientRect().height - originalRect.height))
      .toBeLessThan(0.1)

    window.dispatchEvent(pointerEvent('pointerup', 14, 20, 30))
  })

  test('pointercancel 与 lostpointercapture 都会恢复 source', () => {
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => (
      <Piv
        plugin={draggable({ payload: 'weather', activationDistance: 0 })}
        htmlProps={{ 'data-testid': 'source' }}
      />
    ), host)

    const source = document.querySelector<HTMLElement>('[data-testid="source"]')!
    stubPointerCapture(source)
    source.dispatchEvent(pointerEvent('pointerdown', 9, 10, 10))
    window.dispatchEvent(pointerEvent('pointermove', 9, 30, 40))
    expect(getComputedStyle(source).translate).toBe('20px 30px')

    window.dispatchEvent(pointerEvent('pointercancel', 9, 30, 40))
    expect(getComputedStyle(source).translate).toBe('none')
    expect(document.querySelector('.drag-placeholder')).toBeNull()

    source.dispatchEvent(pointerEvent('pointerdown', 10, 10, 10))
    source.dispatchEvent(pointerEvent('lostpointercapture', 10, 10, 10))
    expect(getComputedStyle(source).translate).toBe('none')
    expect(document.querySelector('.drag-placeholder')).toBeNull()
  })

  test('滚动时 Placeholder 跟随原布局，Top Layer source 留在视口坐标', () => {
    const scroller = document.body.appendChild(document.createElement('div'))
    scroller.style.blockSize = '80px'
    scroller.style.overflow = 'auto'

    dispose = render(() => (
      <div style={{ height: '300px', 'padding-top': '120px' }}>
        <Piv
          plugin={draggable({ payload: 'weather', activationDistance: 0 })}
          style={{ width: '120px', height: '40px' }}
          htmlProps={{ 'data-testid': 'source' }}
        />
      </div>
    ), scroller)

    const source = document.querySelector<HTMLElement>('[data-testid="source"]')!
    stubPointerCapture(source)
    source.dispatchEvent(pointerEvent('pointerdown', 11, 10, 10))
    window.dispatchEvent(pointerEvent('pointermove', 11, 30, 40))

    const placeholder = document.querySelector<HTMLElement>('.drag-placeholder')!
    const sourceTop = source.getBoundingClientRect().top
    const placeholderTop = placeholder.getBoundingClientRect().top

    scroller.scrollTop = 40
    scroller.dispatchEvent(new Event('scroll'))

    expect(Math.abs(source.getBoundingClientRect().top - sourceTop)).toBeLessThan(0.1)
    expect(Math.abs(placeholder.getBoundingClientRect().top - (placeholderTop - 40))).toBeLessThan(0.1)
  })

  test('source 已占用 individual translate 时拒绝开始拖动', () => {
    const source = document.body.appendChild(document.createElement('div'))
    source.style.translate = '3px 4px'
    stubPointerCapture(source)
    const pointerDrag = createPointerDrag({
      source,
      payload: 'weather',
      activationDistance: 0,
      enabled: () => true,
      onDraggingChange: () => undefined,
    })

    expect(() => pointerDrag.start(pointerEvent('pointerdown', 12, 10, 10)))
      .toThrowError('Draggable 来源元素不能预先占用 CSS translate')
    expect(source.hasAttribute('data-dragging')).toBe(false)
    expect(document.querySelector('.drag-placeholder')).toBeNull()
  })

  test('source 已承担 Popover 时拒绝占用它的 Top Layer 状态', () => {
    const source = document.body.appendChild(document.createElement('div'))
    source.setAttribute('popover', 'manual')
    stubPointerCapture(source)
    const pointerDrag = createPointerDrag({
      source,
      payload: 'weather',
      activationDistance: 0,
      enabled: () => true,
      onDraggingChange: () => undefined,
    })

    expect(() => pointerDrag.start(pointerEvent('pointerdown', 13, 10, 10)))
      .toThrowError('Draggable 来源元素不能同时承担 Popover')
    expect(source.getAttribute('popover')).toBe('manual')
    expect(document.querySelector('.drag-placeholder')).toBeNull()
  })
})

function stubPointerCapture(element: HTMLElement): void {
  Object.assign(element, {
    setPointerCapture: vi.fn(),
    hasPointerCapture: vi.fn(() => true),
    releasePointerCapture: vi.fn(),
  })
}

function pointerEvent(
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel' | 'lostpointercapture',
  pointerId: number,
  clientX: number,
  clientY: number,
): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerup' || type === 'pointercancel' || type === 'lostpointercapture'
      ? 0
      : 1,
    pointerId,
    clientX,
    clientY,
  })
}
