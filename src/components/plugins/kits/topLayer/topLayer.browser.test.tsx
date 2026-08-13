import { render } from 'solid-js/web'
import { afterEach, describe, expect, test } from 'vitest'
import { val } from '../../../../hooks'
import { Piv } from '../../../Piv'
import { usePlugin } from '../../usePlugin'
import { enterTopLayer, topLayer, type TopLayerController } from './topLayer'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

describe('topLayer', () => {
  test('Plugin 在原 DOM 上进入和退出 Top Layer', () => {
    let controller!: TopLayerController
    const host = document.body.appendChild(document.createElement('div'))

    dispose = render(() => {
      const [plugin, currentController] = usePlugin(topLayer)
      controller = currentController
      return <Piv plugin={plugin} htmlProps={{ 'data-testid': 'source' }} />
    }, host)

    const source = document.querySelector<HTMLElement>('[data-testid="source"]')!
    expect(source.parentElement).toBe(host)
    expect(source.getAttribute('popover')).toBe('manual')
    expect(source.matches(':popover-open')).toBe(true)
    expect(source.getAttribute('data-top-layer')).toBe('true')
    expect(val(controller.active)).toBe(true)

    controller.leave()
    expect(source.hasAttribute('popover')).toBe(false)
    expect(source.matches(':popover-open')).toBe(false)
    expect(source.hasAttribute('data-top-layer')).toBe(false)
    expect(val(controller.active)).toBe(false)

    controller.enter()
    expect(source.matches(':popover-open')).toBe(true)
    expect(source.getAttribute('data-top-layer')).toBe('true')
    expect(val(controller.active)).toBe(true)
  })

  test('命令式入口不覆盖已有 Popover', () => {
    const source = document.body.appendChild(document.createElement('div'))
    source.setAttribute('popover', 'manual')

    expect(() => enterTopLayer(source))
      .toThrowError('Top Layer 元素不能同时承担 Popover')
    expect(source.getAttribute('popover')).toBe('manual')
  })
})
