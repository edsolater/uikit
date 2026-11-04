import { render } from '@solidjs/web'
import { flush } from 'solid-js'
import { expect, test } from 'vitest'
import { cssRoot } from '@/style-system'
import { ColorShowcase } from './ColorShowcase.example'

test('颜色展示读取 Style System 材料并随主题切换更新', async () => {
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  const host = document.body.appendChild(document.createElement('main'))
  const previous = document.documentElement.getAttribute('data-theme')
  const dispose = render(() => <ColorShowcase />, host)
  try {
    await expect.poll(() => host.querySelectorAll('.ColorShowcasePreview').length).toBeGreaterThan(0)
    const expectPreviews = () => {
      for (const element of host.querySelectorAll<HTMLElement>('.ColorShowcasePreview')) {
        const image = getComputedStyle(element).backgroundImage
        expect(image).toContain('linear-gradient')
        expect(image).toContain('conic-gradient')
      }
    }
    expectPreviews()
    const preview = host.querySelector<HTMLElement>('[data-color-material="surface-color-theme"]')!
    const row = preview.closest('tr')!
    await expect.poll(() => row.textContent).toContain('--surface-color-theme')
    const light = row.cells[1].textContent
    const lightPreview = getComputedStyle(preview).backgroundImage
    expect(lightPreview).toContain('linear-gradient')
    expect(lightPreview).toContain('conic-gradient')
    const dark = [...host.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
      .find((input) => input.parentElement?.textContent?.includes('深色'))!
    dark.click()
    flush()
    await expect.poll(() => document.documentElement.dataset.theme).toBe('dark')
    expectPreviews()
    const currentRow = () => host.querySelector<HTMLElement>('[data-color-material="surface-color-theme"]')!.closest('tr')!
    await expect.poll(() => currentRow().cells[1].textContent).not.toBe(light)
    const darkPreview = getComputedStyle(host.querySelector<HTMLElement>('[data-color-material="surface-color-theme"]')!).backgroundImage
    expect(darkPreview).toContain('linear-gradient')
    expect(darkPreview).toContain('conic-gradient')
    expect(darkPreview).not.toBe(lightPreview)
    expect(currentRow().cells[1].textContent).not.toContain('未定义')
  } finally {
    dispose()
    host.remove()
    style.remove()
    if (previous === null) document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', previous)
  }
})
