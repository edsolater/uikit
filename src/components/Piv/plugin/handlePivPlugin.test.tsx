// @vitest-environment jsdom
import { flush } from 'solid-js'
import { render } from '@solidjs/web'
import { describe, expect, test, vi } from 'vitest'
import { createState, onCleanup, val } from '@/foundation'
import { derive } from '@/hooks/stateUtils'
import { Piv } from '../Piv'
import { getPublicPluginSources } from './publicCapabilities'

vi.mock('./publicCapabilities', () => ({ getPublicPluginSources: vi.fn(() => []) }))

describe('配置插件消费', () => {
  test('完整声明进入原绑定链，同一配置的重复计算不重建实例', () => {
    const host = document.createElement('div')
    const enabled = createState(true)
    const options = { payload: 'complete' }
    const incidental = createState(0)
    let initialized = 0
    let cleaned = 0
    let clicks = 0
    let refs = 0
    let nestedCleaned = 0
    const order: string[] = []
    const plugin = () => {
      initialized += 1
      order.push('injected')
      onCleanup(() => { cleaned += 1 })
      return {
        id: 'complete', class: 'complete', style: { color: 'red' },
        htmlProps: { title: 'complete' }, on: { click: () => { clicks += 1 } },
        ref: () => { refs += 1 },
        plugin: () => {
          order.push('nested')
          onCleanup(() => { nestedCleaned += 1 })
          return { shadowProps: { htmlProps: { 'data-nested': 'complete' } } }
        },
      }
    }
    vi.mocked(getPublicPluginSources).mockImplementation(() => [
      derive([options], () => { val(incidental); return val(enabled) ? options : undefined })
        .map(selection => selection ? plugin : undefined),
    ])
    const dispose = render(() => <Piv plugin={[
      () => { order.push('first'); return undefined },
      () => { order.push('second'); return undefined },
    ]} />, host)
    const element = host.firstElementChild as HTMLElement
    expect(order).toEqual(['second', 'first', 'injected', 'nested'])
    expect([element.id, element.className, element.style.color, element.title]).toEqual(['complete', 'complete', 'red', 'complete'])
    expect(refs).toBe(1)
    expect(element.dataset.nested).toBe('complete')
    element.click()
    expect(clicks).toBe(1)
    incidental.set(1)
    flush()
    expect([initialized, cleaned]).toEqual([1, 0])
    enabled.set(false)
    flush()
    expect([initialized, cleaned]).toEqual([1, 1])
    expect(nestedCleaned).toBe(1)
    expect([element.id, element.className, element.style.color, element.title]).toEqual(['', '', '', ''])
    expect(element.hasAttribute('data-nested')).toBe(false)
    element.click()
    expect(clicks).toBe(1)
    enabled.set(true)
    flush()
    expect(initialized).toBe(2)
    expect(refs).toBe(1)
    element.click()
    expect(clicks).toBe(2)
    dispose()
    expect(cleaned).toBe(2)
    expect(nestedCleaned).toBe(2)
  })
})
