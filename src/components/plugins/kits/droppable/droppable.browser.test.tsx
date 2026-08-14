import { render } from 'solid-js/web'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { Piv } from '../../../Piv'
import { draggable } from '../draggable'
import { DroppableExample } from './droppable.example'
import { droppable } from './droppable'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('droppable', () => {
  test('移动原始 source 后通过真实浏览器几何命中 Droppable', () => {
    const host = document.body.appendChild(document.createElement('div'))
    let receivedPayload: unknown

    dispose = render(() => (
      <div style={{ display: 'grid', gap: '32px', padding: '20px' }}>
        <Piv
          plugin={draggable({ payload: 'weather', activationDistance: 0 })}
          style={{ width: '120px', height: '60px' }}
          htmlProps={{ 'data-testid': 'source' }}
        >
          Weather
        </Piv>
        <Piv
          plugin={droppable({ onDrop: ({ payload }) => { receivedPayload = payload } })}
          style={{ width: '120px', height: '60px' }}
          htmlProps={{ 'data-testid': 'target' }}
        />
      </div>
    ), host)

    const source = document.querySelector<HTMLElement>('[data-testid="source"]')!
    const target = document.querySelector<HTMLElement>('[data-testid="target"]')!
    const sourceRect = source.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const sourcePoint = centerOf(sourceRect)
    const targetPoint = centerOf(targetRect)
    stubPointerCapture(source)

    source.dispatchEvent(pointerEvent('pointerdown', 5, sourcePoint.x, sourcePoint.y))
    window.dispatchEvent(pointerEvent('pointermove', 5, targetPoint.x, targetPoint.y))

    expect(getComputedStyle(source).translate).not.toBe('none')
    expect(document.elementsFromPoint(targetPoint.x, targetPoint.y)).toContain(target)
    expect(target.getAttribute('data-drop-acceptable')).toBe('true')

    window.dispatchEvent(pointerEvent('pointerup', 5, targetPoint.x, targetPoint.y))
    expect(receivedPayload).toBe('weather')
  })

  test('Example 在接收框内持续显示成功结果', () => {
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => <DroppableExample />, host)

    const source = document.querySelector<HTMLElement>('.drag-drop-example-card')!
    const target = document.querySelector<HTMLElement>('.drag-drop-example-target')!
    const result = target.querySelector<HTMLOutputElement>('.drag-drop-example-target-result')!
    stubPointerCapture(source)
    vi.spyOn(document, 'elementsFromPoint').mockReturnValue([target])

    expect(result.textContent).toBe('等待放下')
    source.dispatchEvent(pointerEvent('pointerdown', 6, 10, 10))
    window.dispatchEvent(pointerEvent('pointermove', 6, 30, 30))
    window.dispatchEvent(pointerEvent('pointerup', 6, 30, 30))

    expect(result.parentElement).toBe(target)
    expect(result.textContent).toBe('已接收：{"widget":"weather"}')
    expect(target.getAttribute('data-drop-received')).toBe('true')
  })

  test('接收内部 Pointer payload 与系统外部文件', () => {
    const payload = { widget: 'weather' }
    let receivedPayload: unknown
    let receivedFiles: File[] = []
    let receivedItems: DataTransferItem[] = []
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => (
      <>
        <Piv
          plugin={draggable({ payload, activationDistance: 0 })}
          htmlProps={{ 'data-testid': 'source' }}
        />
        <Piv
          plugin={droppable({ onDrop: (context) => { receivedPayload = context.payload } })}
          htmlProps={{ 'data-testid': 'payload-target' }}
        />
        <Piv
          plugin={droppable({
            accepts: ({ kind, files }) => kind === 'external' && files.length > 0,
            onDrop: (context) => {
              receivedFiles = context.files
              receivedItems = context.items
            },
          })}
          htmlProps={{ 'data-testid': 'file-target' }}
        />
      </>
    ), host)

    const source = document.querySelector<HTMLElement>('[data-testid="source"]')!
    const payloadTarget = document.querySelector<HTMLElement>('[data-testid="payload-target"]')!
    const fileTarget = document.querySelector<HTMLElement>('[data-testid="file-target"]')!
    stubPointerCapture(source)
    vi.spyOn(document, 'elementsFromPoint').mockReturnValue([payloadTarget])

    source.dispatchEvent(pointerEvent('pointerdown', 7, 10, 10))
    window.dispatchEvent(pointerEvent('pointermove', 7, 30, 30))
    expect(payloadTarget.getAttribute('data-drop-acceptable')).toBe('true')
    window.dispatchEvent(pointerEvent('pointerup', 7, 30, 30))
    expect(receivedPayload).toBe(payload)
    expect(payloadTarget.getAttribute('data-drop-hovering')).not.toBe('true')

    const externalTransfer = new DataTransfer()
    externalTransfer.items.add(new File(['hello'], 'hello.txt', { type: 'text/plain' }))
    fileTarget.dispatchEvent(new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      dataTransfer: externalTransfer,
    }))
    fileTarget.dispatchEvent(new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: externalTransfer,
    }))
    expect(receivedFiles.map((file) => file.name)).toEqual(['hello.txt'])
    expect(receivedItems.map((item) => item.kind)).toEqual(['file'])
  })

  test('onDrop 同步卸载 source 时已经完成 Drag 清理', () => {
    const host = document.body.appendChild(document.createElement('div'))
    let disposeTree!: () => void
    let cleanedBeforeDrop = false

    disposeTree = render(() => (
      <>
        <Piv
          plugin={draggable({ payload: 'weather', activationDistance: 0 })}
          htmlProps={{ 'data-testid': 'source' }}
        />
        <Piv
          plugin={droppable({
            accepts: ({ kind }) => kind === 'internal',
            onDrop: (context) => {
              if (context.kind !== 'internal') return
              const { source } = context
              cleanedBeforeDrop = !source.hasAttribute('data-interacting')
                && getComputedStyle(source).translate === 'none'
                && !source.classList.contains('top-layer')
                && !source.matches(':popover-open')
              disposeTree()
            },
          })}
          htmlProps={{ 'data-testid': 'target' }}
        />
      </>
    ), host)
    dispose = disposeTree

    const source = document.querySelector<HTMLElement>('[data-testid="source"]')!
    const target = document.querySelector<HTMLElement>('[data-testid="target"]')!
    stubPointerCapture(source)
    vi.spyOn(document, 'elementsFromPoint').mockReturnValue([target])

    source.dispatchEvent(pointerEvent('pointerdown', 13, 10, 10))
    window.dispatchEvent(pointerEvent('pointerup', 13, 30, 30))

    expect(cleanedBeforeDrop).toBe(true)
    expect(host.childElementCount).toBe(0)
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

function centerOf(rect: DOMRect): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}
