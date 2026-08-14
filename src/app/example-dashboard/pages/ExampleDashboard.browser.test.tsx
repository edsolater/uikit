import { render } from 'solid-js/web'
import { afterEach, describe, expect, test } from 'vitest'
import ExampleDashboard from './ExampleDashboard'

const runnerPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  window.history.replaceState(null, '', runnerPath)
})

describe('ExampleDashboard', () => {
  test('索引不预选详情，选择条目后写入可直达 URL', () => {
    window.history.replaceState(null, '', '/examples')
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <ExampleDashboard />, host)

    expect(document.querySelector('.example-index h1')?.textContent).toBe('Examples')
    expect(document.querySelectorAll('.example-link')).toHaveLength(9)
    expect(document.querySelector('.example-detail')).toBeNull()

    document.querySelector<HTMLAnchorElement>('a[href="/examples/button"]')!.click()

    expect(window.location.pathname).toBe('/examples/button')
    expect(document.querySelector('.example-detail h2')?.textContent).toBe('Button')
    expect(document.querySelectorAll('.example-link')).toHaveLength(0)
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
})
