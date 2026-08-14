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
  test('在 Top Layer 基础位置上移动原始 source', () => {
    let controller!: DraggableController
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => {
      const [plugin, currentController] = usePlugin(draggable, {
        payload: 'weather',
      })
      controller = currentController
      return (
        <Piv
          plugin={plugin}
          style={{
            width: '160px',
            height: '80px',
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
    const originalRect = source.getBoundingClientRect()
    stubPointerCapture(source)
    source.dispatchEvent(pointerEvent('pointerdown', 7, 20, 30))

    const sourceRect = source.getBoundingClientRect()
    expect(source.draggable).toBe(false)
    expect(source.getAttribute('data-dragging')).toBe('true')
    expect(source.getAttribute('popover')).toBe('manual')
    expect(source.matches(':popover-open')).toBe(true)
    expect(source.classList.contains('top-layer')).toBe(true)
    expect(document.querySelector('[data-testid="source"]')).toBe(sourceIdentity)
    expect(document.querySelectorAll('[data-testid="source"]')).toHaveLength(1)
    expect(source.style.getPropertyValue('--drag-x')).toBe('0px')
    expect(source.style.getPropertyValue('--drag-y')).toBe('0px')
    expect(getComputedStyle(source).translate).toBe('0px')
    expect(source.style.transform).toBe('rotate(1deg)')
    expect(getComputedStyle(source).visibility).not.toBe('hidden')
    expect(getComputedStyle(source).pointerEvents).toBe('none')
    expect(getComputedStyle(source).boxShadow).not.toBe('none')
    expect(Math.abs(sourceRect.left - originalRect.left)).toBeLessThan(0.1)
    expect(Math.abs(sourceRect.top - originalRect.top)).toBeLessThan(0.1)
    expect(Math.abs(sourceRect.width - originalRect.width)).toBeLessThan(0.1)
    expect(Math.abs(sourceRect.height - originalRect.height)).toBeLessThan(0.1)
    expect(val(controller.dragging)).toBe(true)

    window.dispatchEvent(pointerEvent('pointermove', 7, 52, 74))
    expect(source.style.getPropertyValue('--drag-x')).toBe('32px')
    expect(source.style.getPropertyValue('--drag-y')).toBe('44px')
    expect(getComputedStyle(source).translate).toBe('32px 44px')
    expect(document.querySelector('[data-testid="source"]')).toBe(sourceIdentity)

    window.dispatchEvent(pointerEvent('pointerup', 7, 52, 74))
    expect(source.style.getPropertyValue('--drag-x')).toBe('')
    expect(source.style.getPropertyValue('--drag-y')).toBe('')
    expect(getComputedStyle(source).translate).toBe('none')
    expect(source.hasAttribute('data-dragging')).toBe(false)
    expect(source.hasAttribute('popover')).toBe(false)
    expect(source.classList.contains('top-layer')).toBe(false)
    expect(source.matches(':popover-open')).toBe(false)
    expect(val(controller.dragging)).toBe(false)
  })

  test('默认在按下时立即开始拖动', () => {
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
    expect(source.getAttribute('data-dragging')).toBe('true')
    expect(source.classList.contains('top-layer')).toBe(true)
    expect(source.style.getPropertyValue('--drag-x')).toBe('0px')
    expect(source.style.getPropertyValue('--drag-y')).toBe('0px')
  })

  test('显式激活距离默认承接按下后的累计位移', () => {
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => (
      <Piv
        plugin={draggable({ payload: 'weather', activationDistance: 6 })}
        htmlProps={{ 'data-testid': 'source' }}
      />
    ), host)

    const source = document.querySelector<HTMLElement>('[data-testid="source"]')!
    stubPointerCapture(source)
    source.dispatchEvent(pointerEvent('pointerdown', 8, 0, 0))
    window.dispatchEvent(pointerEvent('pointermove', 8, 3, 4))
    expect(source.getAttribute('data-dragging')).not.toBe('true')
    expect(source.classList.contains('top-layer')).toBe(false)

    window.dispatchEvent(pointerEvent('pointermove', 8, 6, 4))
    expect(source.getAttribute('data-dragging')).toBe('true')
    expect(source.classList.contains('top-layer')).toBe(true)
    expect(source.style.getPropertyValue('--drag-x')).toBe('6px')
    expect(source.style.getPropertyValue('--drag-y')).toBe('4px')
  })

  test('可以消费激活距离后再开始移动 source', () => {
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => (
      <Piv
        plugin={draggable({
          payload: 'weather',
          activationDistance: 6,
          activationJump: false,
        })}
        htmlProps={{ 'data-testid': 'source' }}
      />
    ), host)

    const source = document.querySelector<HTMLElement>('[data-testid="source"]')!
    stubPointerCapture(source)
    source.dispatchEvent(pointerEvent('pointerdown', 18, 0, 0))
    window.dispatchEvent(pointerEvent('pointermove', 18, 8, 0))
    expect(source.style.getPropertyValue('--drag-x')).toBe('2px')
    expect(source.style.getPropertyValue('--drag-y')).toBe('0px')

    window.dispatchEvent(pointerEvent('pointermove', 18, 10, 0))
    expect(source.style.getPropertyValue('--drag-x')).toBe('4px')
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
    expect(source.classList.contains('top-layer')).toBe(false)

    source.dispatchEvent(pointerEvent('pointerdown', 10, 10, 10))
    source.dispatchEvent(pointerEvent('lostpointercapture', 10, 10, 10))
    expect(getComputedStyle(source).translate).toBe('none')
    expect(source.classList.contains('top-layer')).toBe(false)
  })

  test('source 已占用 individual translate 时拒绝开始拖动', () => {
    const source = document.body.appendChild(document.createElement('div'))
    source.style.translate = '3px 4px'
    stubPointerCapture(source)
    const pointerDrag = createPointerDrag({
      source,
      payload: 'weather',
      activationDistance: 0,
      activationJump: true,
      enabled: () => true,
      onDraggingChange: () => undefined,
    })

    expect(() => pointerDrag.start(pointerEvent('pointerdown', 12, 10, 10)))
      .toThrowError('Draggable 来源元素不能预先占用 CSS translate')
    expect(source.hasAttribute('data-dragging')).toBe(false)
    expect(source.classList.contains('top-layer')).toBe(false)
  })

  test('source 已承担 Popover 时拒绝占用它的 Top Layer 状态', () => {
    const source = document.body.appendChild(document.createElement('div'))
    source.setAttribute('popover', 'manual')
    stubPointerCapture(source)
    const pointerDrag = createPointerDrag({
      source,
      payload: 'weather',
      activationDistance: 0,
      activationJump: true,
      enabled: () => true,
      onDraggingChange: () => undefined,
    })

    expect(() => pointerDrag.start(pointerEvent('pointerdown', 13, 10, 10)))
      .toThrowError('Top Layer 元素不能同时承担 Popover')
    expect(source.getAttribute('popover')).toBe('manual')
    expect(source.classList.contains('top-layer')).toBe(false)
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
