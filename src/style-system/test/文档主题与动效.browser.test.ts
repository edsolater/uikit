import { expect, test } from 'vitest'
import { cssRoot } from '@/style-system'
import '@/components'
import '@/css/all-base.css'

test('文档主题、对话框动效与滚动条样式由系统挂载并响应主题', async () => {
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  const dialog = document.body.appendChild(document.createElement('dialog'))
  const heading = document.body.appendChild(document.createElement('h1'))
  const image = document.body.appendChild(document.createElement('img'))
  const theme = document.documentElement.getAttribute('data-theme')
  document.documentElement.removeAttribute('data-theme')
  try {
    cssRoot.mount()
    const light = getComputedStyle(document.body).backgroundColor
    expect(style.textContent).toContain('@starting-style')
    expect(getComputedStyle(document.documentElement).scrollbarGutter).toBe(
      'stable',
    )
    expect(getComputedStyle(document.documentElement).fontFamily).toContain(
      'system-ui',
    )
    expect(getComputedStyle(document.body).minBlockSize).not.toBe('0px')
    expect(getComputedStyle(heading).textWrap).toBe('balance')
    expect(getComputedStyle(image).display).toBe('block')
    expect(getComputedStyle(document.body).transitionDuration).toContain(
      '0.12s',
    )
    dialog.showModal()
    await Promise.all(
      dialog.getAnimations().map((animation) => animation.finished),
    )
    expect(getComputedStyle(dialog).opacity).toBe('1')
    expect(getComputedStyle(dialog).transform).toBe('none')
    expect(getComputedStyle(dialog, '::backdrop').backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    )
    document.documentElement.setAttribute('data-theme', 'dark')
    expect(getComputedStyle(document.body).backgroundColor).not.toBe(light)
  } finally {
    dialog.close()
    dialog.remove()
    heading.remove()
    image.remove()
    style.remove()
    if (theme === null) document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', theme)
  }
})
