import { render } from 'solid-js/web'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { Piv } from '../../../Piv'
import { draggable } from '../draggable'
import { DroppableDemo } from './droppable.demo'
import { droppable } from './droppable'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('droppable', () => {
  test('Demo 在接收框内持续显示成功结果', () => {
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => <DroppableDemo />, host)

    const source = document.querySelector<HTMLElement>('.drag-drop-demo-card')!
    const target = document.querySelector<HTMLElement>('.drag-drop-demo-target')!
    const result = target.querySelector<HTMLOutputElement>('.drag-drop-demo-target-result')!
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
