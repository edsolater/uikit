import { render } from 'solid-js/web'
import { afterEach, describe, expect, test } from 'vitest'
import '../../../css/all-base.css'
import ExampleDashboard from './ExampleDashboard'

const runnerPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  document.documentElement.removeAttribute('data-theme')
  window.history.replaceState(null, '', runnerPath)
})

describe('ExampleDashboard', () => {
  test('主页不预选详情，选择条目后写入可直达 URL', () => {
    window.history.replaceState(null, '', '/examples')
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <ExampleDashboard />, host)

    expect(document.querySelector('.example-home h1')?.textContent).toBe('Examples')
    expect(document.querySelectorAll('.example-link')).toHaveLength(10)
    expect(document.querySelectorAll('.example-link h2')).toHaveLength(10)
    expect(document.querySelectorAll('.example-link p')).toHaveLength(10)
    expect(document.querySelectorAll('.example-link-ribbon')).toHaveLength(10)
    expect(document.querySelectorAll('.example-link[data-thumbnail]')).toHaveLength(10)
    expect(document.querySelectorAll('.example-link-thumbnail')).toHaveLength(10)

    const thumbnail = document.querySelector<HTMLElement>('.example-link-thumbnail')!
    const copy = document.querySelector<HTMLElement>('.example-link-copy')!
    const ribbons = [...document.querySelectorAll<HTMLElement>('.example-link-ribbon')]
    expect(getComputedStyle(thumbnail).maskImage).toContain('linear-gradient')
    expect(getComputedStyle(copy).backgroundImage).toBe('none')
    expect(new Set(ribbons.map(ribbon => getComputedStyle(ribbon).backgroundColor)).size).toBe(5)

    expect(document.querySelector('.example-home-head p')).toBeNull()
    expect(document.querySelector('.example-category-nav')).toBeNull()
    expect(document.querySelector('.example-link-action')).toBeNull()
    expect(document.querySelector('.example-detail')).toBeNull()

    document.querySelector<HTMLAnchorElement>('a[href="/examples/card"]')!.click()

    expect(window.location.pathname).toBe('/examples/card')
    expect(document.querySelector('.example-detail h2')?.textContent).toBe('Card')
    expect(document.querySelectorAll('.example-link')).toHaveLength(0)

    const defaultCard = document.querySelector<HTMLElement>('.Card.example-card')!
    const smallCard = document.querySelector<HTMLElement>('.card-example-item[data-size="small"]')!
    const largeCard = document.querySelector<HTMLElement>('.card-example-item[data-size="large"]')!
    const softCard = document.querySelector<HTMLElement>('.card-example-item[data-tone="soft"]')!
    const solidCard = document.querySelector<HTMLElement>('.card-example-item[data-tone="solid"]')!
    expect(getComputedStyle(defaultCard).display).toBe('grid')
    expect(Number.parseFloat(getComputedStyle(defaultCard).padding)).toBeGreaterThan(0)
    expect(Number.parseFloat(getComputedStyle(largeCard).padding)).toBeGreaterThan(
      Number.parseFloat(getComputedStyle(smallCard).padding),
    )
    expect(getComputedStyle(softCard).backgroundColor).not.toBe(
      getComputedStyle(solidCard).backgroundColor,
    )
  })

  test('详情 URL 可以直接打开并跟随浏览历史变化', () => {
    window.history.replaceState(null, '', '/examples/droppable')
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <ExampleDashboard />, host)

    expect(document.querySelector('.example-detail h2')?.textContent).toBe('Droppable')

    window.history.replaceState(null, '', '/examples/scope')
    window.dispatchEvent(new PopStateEvent('popstate'))

    expect(document.querySelector('.example-detail h2')?.textContent).toBe('Scope + Drag and Drop')
  })

  test('Draggable 实际拖动期间 Card 始终不使用 Blur', () => {
    window.history.replaceState(null, '', '/examples/draggable')
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <ExampleDashboard />, host)

    const shell = document.querySelector<HTMLElement>('.example-shell')!
    const card = document.querySelector<HTMLElement>('.Card.example-card')!
    const source = document.querySelector<HTMLElement>('.drag-drop-example-card')!
    Object.assign(source, {
      setPointerCapture: () => undefined,
      hasPointerCapture: () => true,
      releasePointerCapture: () => undefined,
    })

    const lightBackground = getComputedStyle(card).backgroundColor
    const initialFilter = getComputedStyle(card).backdropFilter
    expect(getComputedStyle(shell).backgroundImage).toContain('radial-gradient')
    expect(getComputedStyle(shell).filter).toBe('none')
    expect(initialFilter).toContain('saturate(1.12)')
    expect(initialFilter).not.toContain('blur(')
    expect(getComputedStyle(card).borderStyle).toBe('solid')
    expect(getComputedStyle(card).boxShadow).not.toBe('none')

    document.documentElement.dataset.theme = 'dark'
    expect(getComputedStyle(card).backgroundColor).not.toBe(lightBackground)

    source.dispatchEvent(pointerEvent('pointerdown', 21, 20, 30))
    expect(source.getAttribute('data-interacting')).toBe('true')
    expect(source.classList.contains('top-layer')).toBe(true)
    expect(getComputedStyle(card).backdropFilter).toBe(initialFilter)

    window.dispatchEvent(pointerEvent('pointermove', 21, 52, 74))
    expect(getComputedStyle(source).translate).toBe('32px 44px')
    expect(getComputedStyle(card).backdropFilter).toBe(initialFilter)
    expect(getComputedStyle(card).backdropFilter).not.toContain('blur(')

    window.dispatchEvent(pointerEvent('pointerup', 21, 52, 74))
    expect(source.hasAttribute('data-interacting')).toBe(false)
    expect(source.classList.contains('top-layer')).toBe(false)
    expect(getComputedStyle(card).backdropFilter).toBe(initialFilter)
  })
})

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
