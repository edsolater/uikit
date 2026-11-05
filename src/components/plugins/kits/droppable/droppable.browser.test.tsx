import { flush } from 'solid-js'
import { render } from '@solidjs/web'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { cssRoot } from '@/style-system'
import { val } from '@/foundation'
import { Card } from '@/components/kits/Card/Card'
import { usePlugin } from '@/components/plugins/usePlugin'
import type { DraggableController } from '@/components/plugins/kits/draggable/draggable'
import type { DroppableController } from './droppable'
import { Piv } from '../../../Piv/Piv'
import { draggable } from '../draggable/draggable'
import { DroppableExample } from './droppable.example'
import { droppable } from './droppable'

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
  vi.restoreAllMocks()
})

describe('droppable', () => {
  test('移动原始 source 后通过真实浏览器几何命中 Droppable', () => {
    const host = document.body.appendChild(document.createElement('div'))
    let receivedPayload: unknown

    dispose = render(
      () => (
        <div style={{ display: 'grid', gap: '32px', padding: '20px' }}>
          <Piv
            is={draggable({ payload: 'weather', activationDistance: 0 })}
            style={{ width: '120px', height: '60px' }}
            htmlProps={{ 'data-testid': 'source' }}
          >
            Weather
          </Piv>
          <Piv
            is={droppable({
              onDrop: ({ payload }) => {
                receivedPayload = payload
              },
            })}
            style={{ width: '120px', height: '60px' }}
            htmlProps={{ 'data-testid': 'target' }}
          />
        </div>
      ),
      host,
    )

    const source = document.querySelector<HTMLElement>(
      '[data-testid="source"]',
    )!
    const target = document.querySelector<HTMLElement>(
      '[data-testid="target"]',
    )!
    const sourceRect = source.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const sourcePoint = centerOf(sourceRect)
    const targetPoint = centerOf(targetRect)
    stubPointerCapture(source)

    source.dispatchEvent(
      pointerEvent('pointerdown', 5, sourcePoint.x, sourcePoint.y),
    )
    flush()
    window.dispatchEvent(
      pointerEvent('pointermove', 5, targetPoint.x, targetPoint.y),
    )
    flush()

    expect(getComputedStyle(source).translate).not.toBe('none')
    expect(document.elementsFromPoint(targetPoint.x, targetPoint.y)).toContain(
      target,
    )
    expect(target.getAttribute('data-drop-acceptable')).toBe('true')

    window.dispatchEvent(
      pointerEvent('pointerup', 5, targetPoint.x, targetPoint.y),
    )
    flush()
    expect(receivedPayload).toBe('weather')
  })

  test('Example 在接收框内持续显示成功结果', () => {
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => <DroppableExample />, host)

    const source = document.querySelector<HTMLElement>(
      '.drag-drop-example-card',
    )!
    const target = document.querySelector<HTMLElement>(
      '.drag-drop-example-target',
    )!
    const result = target.querySelector<HTMLOutputElement>(
      '.drag-drop-example-target-result',
    )!
    stubPointerCapture(source)
    vi.spyOn(document, 'elementsFromPoint').mockReturnValue([target])

    expect(result.textContent).toBe('等待放下')
    source.dispatchEvent(pointerEvent('pointerdown', 6, 10, 10))
    flush()
    window.dispatchEvent(pointerEvent('pointermove', 6, 30, 30))
    flush()
    window.dispatchEvent(pointerEvent('pointerup', 6, 30, 30))
    flush()

    expect(result.parentElement).toBe(target)
    expect(result.textContent).toBe('已接收：{"widget":"weather"}')
    expect(target.getAttribute('data-drop-received')).toBe('true')
  })

  test('接收内部 Pointer payload 与系统外部文件', () => {
    const payload = { widget: 'weather' }
    const fileGroup = {}
    let receivedPayload: unknown
    let receivedFiles: File[] = []
    let receivedItems: DataTransferItem[] = []
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(
      () => (
        <>
          <Piv
            is={draggable({ payload, activationDistance: 0 })}
            htmlProps={{ 'data-testid': 'source' }}
          />
          <Piv
            is={droppable({
              onDrop: (context) => {
                receivedPayload = context.payload
              },
            })}
            htmlProps={{ 'data-testid': 'payload-target' }}
          />
          <Piv
            is={droppable({
              id: fileGroup,
              accepts: ({ kind, files }) =>
                kind === 'external' && files.length > 0,
              onDrop: (context) => {
                receivedFiles = context.files
                receivedItems = context.items
              },
            })}
            htmlProps={{ 'data-testid': 'file-target' }}
          />
        </>
      ),
      host,
    )

    const source = document.querySelector<HTMLElement>(
      '[data-testid="source"]',
    )!
    const payloadTarget = document.querySelector<HTMLElement>(
      '[data-testid="payload-target"]',
    )!
    const fileTarget = document.querySelector<HTMLElement>(
      '[data-testid="file-target"]',
    )!
    stubPointerCapture(source)
    vi.spyOn(document, 'elementsFromPoint').mockReturnValue([payloadTarget])

    source.dispatchEvent(pointerEvent('pointerdown', 7, 10, 10))
    flush()
    window.dispatchEvent(pointerEvent('pointermove', 7, 30, 30))
    flush()
    expect(payloadTarget.getAttribute('data-drop-acceptable')).toBe('true')
    window.dispatchEvent(pointerEvent('pointerup', 7, 30, 30))
    flush()
    expect(receivedPayload).toBe(payload)
    expect(payloadTarget.getAttribute('data-drop-hovering')).not.toBe('true')

    const externalTransfer = new DataTransfer()
    externalTransfer.items.add(
      new File(['hello'], 'hello.txt', { type: 'text/plain' }),
    )
    fileTarget.dispatchEvent(
      new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: externalTransfer,
      }),
    )
    flush()
    fileTarget.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: externalTransfer,
      }),
    )
    flush()
    expect(receivedFiles.map((file) => file.name)).toEqual(['hello.txt'])
    expect(receivedItems.map((item) => item.kind)).toEqual(['file'])
  })

  test('共享 id 跨容器协作，不同 id 在同容器内拒绝且来源移动不改变分组', () => {
    const groupA = {}
    const groupB = {}
    let receivedA = 0
    let receivedB = 0
    let receivedUngrouped = 0
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <>
          <div data-testid="container-a">
            <Piv
              is={draggable({ id: groupA, payload: '材料' })}
              htmlProps={{ 'data-testid': 'group-source' }}
            />
            <Piv
              is={droppable({
                id: groupB,
                onDrop: () => {
                  receivedB++
                },
              })}
              htmlProps={{ 'data-testid': 'group-b' }}
            />
            <Piv
              is={droppable({
                onDrop: () => {
                  receivedUngrouped++
                },
              })}
              htmlProps={{ 'data-testid': 'ungrouped' }}
            />
          </div>
          <div data-testid="container-b">
            <Piv
              is={droppable({
                id: groupA,
                onDrop: () => {
                  receivedA++
                },
              })}
              htmlProps={{ 'data-testid': 'group-a' }}
            />
          </div>
        </>
      ),
      host,
    )
    const source = host.querySelector<HTMLElement>(
      '[data-testid="group-source"]',
    )!
    const targetA = host.querySelector<HTMLElement>('[data-testid="group-a"]')!
    const targetB = host.querySelector<HTMLElement>('[data-testid="group-b"]')!
    const ungrouped = host.querySelector<HTMLElement>(
      '[data-testid="ungrouped"]',
    )!
    stubPointerCapture(source)
    const hit = vi.spyOn(document, 'elementsFromPoint')
    const dragTo = (target: HTMLElement, pointerId: number) => {
      hit.mockReturnValue([target])
      source.dispatchEvent(pointerEvent('pointerdown', pointerId, 10, 10))
      flush()
      window.dispatchEvent(pointerEvent('pointermove', pointerId, 30, 30))
      flush()
      window.dispatchEvent(pointerEvent('pointerup', pointerId, 30, 30))
      flush()
    }
    dragTo(targetB, 14)
    expect(receivedB).toBe(0)
    dragTo(ungrouped, 17)
    expect(receivedUngrouped).toBe(0)
    dragTo(targetA, 15)
    expect(receivedA).toBe(1)
    hit.mockReturnValue([targetA])
    source.dispatchEvent(pointerEvent('pointerdown', 16, 10, 10))
    flush()
    host.querySelector('[data-testid="container-b"]')!.appendChild(source)
    window.dispatchEvent(pointerEvent('pointermove', 16, 30, 30))
    flush()
    window.dispatchEvent(pointerEvent('pointerup', 16, 30, 30))
    flush()
    expect(receivedA).toBe(2)
  })

  test('外部文件不比较 id，目标禁用或拒绝材料时不接收', () => {
    const host = document.body.appendChild(document.createElement('div'))
    const onDrop = vi.fn()
    dispose = render(
      () => (
        <>
          <Piv
            is={droppable({ id: {}, disabled: true, onDrop })}
            htmlProps={{ 'data-testid': 'disabled-file' }}
          />
          <Piv
            is={droppable({ id: {}, accepts: () => false, onDrop })}
            htmlProps={{ 'data-testid': 'rejected-file' }}
          />
        </>
      ),
      host,
    )
    const transfer = new DataTransfer()
    transfer.items.add(new File(['hello'], 'hello.txt', { type: 'text/plain' }))
    for (const target of host.querySelectorAll<HTMLElement>('[data-testid]')) {
      target.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: transfer,
        }),
      )
    }
    flush()
    expect(onDrop).not.toHaveBeenCalled()
  })

  test('onDrop 同步卸载 source 时已经完成 Drag 清理', () => {
    const host = document.body.appendChild(document.createElement('div'))
    let disposeTree!: () => void
    let cleanedBeforeDrop = false

    disposeTree = render(
      () => (
        <>
          <Piv
            is={draggable({ payload: 'weather', activationDistance: 0 })}
            htmlProps={{ 'data-testid': 'source' }}
          />
          <Piv
            is={droppable({
              accepts: ({ kind }) => kind === 'internal',
              onDrop: (context) => {
                if (context.kind !== 'internal') return
                const { source } = context
                cleanedBeforeDrop =
                  !source.hasAttribute('data-interacting') &&
                  getComputedStyle(source).translate === 'none' &&
                  !source.classList.contains('top-layer') &&
                  !source.matches(':popover-open')
                disposeTree()
              },
            })}
            htmlProps={{ 'data-testid': 'target' }}
          />
        </>
      ),
      host,
    )
    dispose = disposeTree

    const source = document.querySelector<HTMLElement>(
      '[data-testid="source"]',
    )!
    const target = document.querySelector<HTMLElement>(
      '[data-testid="target"]',
    )!
    stubPointerCapture(source)
    vi.spyOn(document, 'elementsFromPoint').mockReturnValue([target])

    source.dispatchEvent(pointerEvent('pointerdown', 13, 10, 10))
    flush()
    window.dispatchEvent(pointerEvent('pointerup', 13, 30, 30))
    flush()

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

test('相同角色分别调用后，两个宿主的成员和启停状态独立', async () => {
  const host = document.body.appendChild(document.createElement('div'))
  let first: Partial<DroppableController> = {}
  let second: Partial<DroppableController> = {}
  dispose = render(() => {
    const [firstPlugin, firstController] = usePlugin(droppable)
    const [secondPlugin, secondController] = usePlugin(droppable)
    first = firstController
    second = secondController
    return (
      <>
        <Card is={firstPlugin} />
        <Card is={secondPlugin} />
      </>
    )
  }, host)
  await expect.poll(() => first.enabled).toBeDefined()
  expect(first!.enabled).not.toBe(second!.enabled)
  first.disable?.()
  await expect.poll(() => val(first.enabled!)).toBe(false)
  expect(val(second.enabled!)).toBe(true)
})

test('拖动控制影响真实拖动并能取消正在进行的拖动', () => {
  const host = document.body.appendChild(document.createElement('div'))
  let members: Partial<DraggableController> = {}
  dispose = render(() => {
    const [plugin, controller] = usePlugin(draggable, { payload: '材料' })
    members = controller
    return <Card is={plugin} />
  }, host)
  const source = host.firstElementChild as HTMLElement
  expect(getComputedStyle(source).touchAction).toBe('none')
  Object.assign(source, {
    setPointerCapture() {},
    hasPointerCapture: () => true,
    releasePointerCapture() {},
  })
  const pointer = (type: string, x: number) =>
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      isPrimary: true,
      button: 0,
      buttons: 1,
      pointerId: 21,
      clientX: x,
      clientY: x,
    })
  members.disable!()
  flush()
  source.dispatchEvent(pointer('pointerdown', 10))
  window.dispatchEvent(pointer('pointermove', 30))
  flush()
  expect(val(members.dragging!)).toBe(false)
  members.enable!()
  flush()
  source.dispatchEvent(pointer('pointerdown', 10))
  window.dispatchEvent(pointer('pointermove', 30))
  flush()
  expect(val(members.dragging!)).toBe(true)
  expect(source.getAttribute('data-interacting')).toBe('true')
  expect(getComputedStyle(source).translate).not.toBe('none')
  members.disable!()
  expect(source.hasAttribute('data-interacting')).toBe(false)
  flush()
  expect(val(members.dragging!)).toBe(false)
})
