import { render } from 'solid-js/web'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { val } from '../../../../hooks'
import { Piv } from '../../../Piv'
import { usePlugin } from '../../usePlugin'
import { draggable, type DraggableController } from './draggable'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('draggable', () => {
  test('使用 Pointer Events 创建 transform 预览并保留原位置', () => {
    let controller!: DraggableController
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => {
      const [plugin, currentController] = usePlugin(draggable, {
        payload: 'weather',
        activationDistance: 0,
      })
      controller = currentController
      return <Piv plugin={plugin} htmlProps={{ 'data-testid': 'source' }}>Weather</Piv>
    }, host)

    const source = document.querySelector<HTMLElement>('[data-testid="source"]')!
    stubPointerCapture(source)
    source.dispatchEvent(pointerEvent('pointerdown', 7, 20, 30))

    const preview = document.querySelector<HTMLElement>('.drag-preview')!
    expect(source.draggable).toBe(false)
    expect(source.getAttribute('data-dragging')).toBe('true')
    expect(preview).not.toBe(source)
    expect(preview.textContent).toBe('Weather')
    expect(preview.style.transform).toBe('translate3d(0px, 0px, 0px)')
    expect(getComputedStyle(source).visibility).toBe('hidden')
    expect(getComputedStyle(preview).opacity).toBe('1')
    expect(getComputedStyle(preview).pointerEvents).toBe('none')
    expect(getComputedStyle(preview).boxShadow).not.toBe('none')
    expect(val(controller.dragging)).toBe(true)

    window.dispatchEvent(pointerEvent('pointermove', 7, 52, 74))
    expect(preview.style.transform).toBe('translate3d(32px, 44px, 0px)')

    window.dispatchEvent(pointerEvent('pointerup', 7, 52, 74))
    expect(document.querySelector('.drag-preview')).toBeNull()
    expect(source.hasAttribute('data-dragging')).toBe(false)
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
    expect(document.querySelector('.drag-preview')).toBeNull()

    window.dispatchEvent(pointerEvent('pointermove', 8, 6, 4))
    expect(document.querySelector('.drag-preview')).not.toBeNull()
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
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  pointerId: number,
  clientX: number,
  clientY: number,
): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
    pointerId,
    clientX,
    clientY,
  })
}
