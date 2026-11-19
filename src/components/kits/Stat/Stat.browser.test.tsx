/** 在浏览器真实排版后检查空内容、折行、动态高度策略及实例隔离。 */
import { expect, test } from 'vitest'
import { createState, render, val } from '@/foundation'
import { cssRoot } from '@/style-system'
import { Stat } from './Stat'

test('Stat 记住自然内容峰值，fitContent 随内容收放，重挂重新测量', async () => {
  const host = document.body.appendChild(document.createElement('div'))
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host.style.cssText = 'width:300px;line-height:20px'
  const text = createState(''),
    fit = createState(false)
  const mount = () =>
    render(() => <Stat fitContent={fit}>{val(text)}</Stat>, host)
  let dispose = mount()
  const height = () => host.firstElementChild!.getBoundingClientRect().height
  const settle = () =>
    new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )
  try {
    expect(height()).toBe(20)
    text.set('读数 '.repeat(28))
    host.style.width = '65px'
    await settle()
    const peak = height()
    expect(peak).toBeGreaterThan(40)
    host.style.width = '300px'
    await settle()
    expect(height()).toBe(peak)
    text.set('短')
    await settle()
    expect(height()).toBe(peak)
    text.set('')
    await settle()
    expect(height()).toBe(peak)
    fit.set(true)
    await settle()
    expect(height()).toBe(0)
    fit.set(false)
    await settle()
    expect(height()).toBe(peak)
    dispose()
    dispose = mount()
    await settle()
    expect(height()).toBe(20)
    host.style.cssText = 'display:flex;height:180px;line-height:20px'
    await settle()
    expect(height()).toBe(180)
    host.style.height = 'auto'
    await settle()
    expect(height()).toBe(20)
  } finally {
    dispose()
    host.remove()
    style.remove()
  }
})
