import { expect, test } from 'vitest'
import { cssRoot } from '@/style-system'
import '@/components'

test('组件入口登记三项 is 能力及滚动条样式', () => {
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  const host = document.body.appendChild(document.createElement('div'))
  host.className = 'is:backdrop-root is:scroll-area is:self-host-scroll-behavior'
  try {
    const computed = getComputedStyle(host)
    expect(computed.clipPath).toBe('inset(0px)')
    expect(computed.overflowY).toBe('auto')
    expect(computed.scrollbarGutter).toBe('stable')
    expect(computed.overscrollBehavior).toBe('contain')
    expect(computed.overflowAnchor).toBe('none')
    const thumb = getComputedStyle(host, '::-webkit-scrollbar-thumb')
    expect(thumb.borderTopWidth).toBe('3px')
    expect(thumb.borderRadius).toBe('999px')
    expect(thumb.backgroundClip).toBe('content-box')
    expect(style.textContent).toContain('rgb(255 255 255 / 0.34)')
  } finally {
    host.remove()
    style.remove()
  }
})
