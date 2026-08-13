import { render } from 'solid-js/web'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { Piv } from '../../../Piv'
import { dragAndDrop } from '../dragAndDrop'
import { draggable } from '../draggable'
import { droppable } from '../droppable'
import { findScopeBoundary, scope } from './scope'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('scope', () => {
  test('沿 composed tree 穿过 ShadowRoot 查找 Scope', () => {
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => (
      <Piv
        plugin={scope({ capabilities: [dragAndDrop] })}
        htmlProps={{ 'data-testid': 'scope-host' }}
      />
    ), host)

    const scopeHost = document.querySelector<HTMLElement>('[data-testid="scope-host"]')!
    const source = scopeHost.attachShadow({ mode: 'open' }).appendChild(document.createElement('div'))

    expect(findScopeBoundary(source, dragAndDrop)).toBe(findScopeBoundary(scopeHost, dragAndDrop))
  })

  test('允许同范围 Pointer Drag and Drop 并拒绝跨范围放下', () => {
    let aDrops = 0
    let bDrops = 0
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => (
      <>
        <Piv plugin={scope({ capabilities: [dragAndDrop] })}>
          <Piv
            plugin={draggable({ payload: 'A', activationDistance: 0 })}
            htmlProps={{ 'data-testid': 'source-a' }}
          />
          <Piv
            plugin={droppable({ onDrop: () => { aDrops += 1 } })}
            htmlProps={{ 'data-testid': 'target-a' }}
          />
        </Piv>
        <Piv plugin={scope({ capabilities: [dragAndDrop] })}>
          <Piv
            plugin={droppable({ onDrop: () => { bDrops += 1 } })}
            htmlProps={{ 'data-testid': 'target-b' }}
          />
        </Piv>
      </>
    ), host)

    const sourceA = document.querySelector<HTMLElement>('[data-testid="source-a"]')!
    const targetA = document.querySelector<HTMLElement>('[data-testid="target-a"]')!
    const targetB = document.querySelector<HTMLElement>('[data-testid="target-b"]')!
    stubPointerCapture(sourceA)

    vi.spyOn(document, 'elementsFromPoint').mockReturnValue([targetA])
    sourceA.dispatchEvent(pointerEvent('pointerdown', 7, 10, 10))
    window.dispatchEvent(pointerEvent('pointermove', 7, 20, 20))
    expect(targetA.getAttribute('data-drop-acceptable')).toBe('true')
    window.dispatchEvent(pointerEvent('pointerup', 7, 20, 20))
    expect(aDrops).toBe(1)

    vi.mocked(document.elementsFromPoint).mockReturnValue([targetB])
    sourceA.dispatchEvent(pointerEvent('pointerdown', 8, 10, 10))
    window.dispatchEvent(pointerEvent('pointermove', 8, 20, 20))
    expect(targetB.getAttribute('data-drop-hovering')).toBe('true')
    expect(targetB.getAttribute('data-drop-acceptable')).not.toBe('true')
    window.dispatchEvent(pointerEvent('pointerup', 8, 20, 20))
    expect(bDrops).toBe(0)
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
