import { render } from 'solid-js/web'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { Piv } from '../../../Piv'
import { draggable } from '../draggable'
import { droppable } from './droppable'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('droppable', () => {
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
    source.dispatchEvent(pointerEvent('pointermove', 7, 30, 30))
    expect(payloadTarget.getAttribute('data-drop-acceptable')).toBe('true')
    source.dispatchEvent(pointerEvent('pointerup', 7, 30, 30))
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
