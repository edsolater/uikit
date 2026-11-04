import { expect, test } from 'vitest'
import { cssRoot } from '@/style-system'
import './DragAndDrop.example.style'

test('拖拽示例接收区域表达悬停、可接收和已接收状态', () => {
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  const target = document.body.appendChild(document.createElement('div'))
  target.className = 'drag-drop-example-target'
  target.style.transition = 'none'
  const result = target.appendChild(document.createElement('output'))
  result.className = 'drag-drop-example-target-result'
  try {
    const original = getComputedStyle(target).backgroundColor
    target.dataset.dropHovering = 'true'
    const hovering = getComputedStyle(target).backgroundColor
    expect(hovering).not.toBe(original)
    target.dataset.dropAcceptable = 'true'
    const acceptable = getComputedStyle(target).backgroundColor
    expect(acceptable).not.toBe(hovering)
    target.dataset.dropReceived = 'true'
    expect(getComputedStyle(target).borderStyle).toBe('solid')
    expect(getComputedStyle(target).backgroundColor).not.toBe(acceptable)
    expect(Number(getComputedStyle(result).fontWeight)).toBeGreaterThan(400)
  } finally {
    target.remove()
    style.remove()
  }
})

test('拖拽源和接收区随浅深主题改变材料', () => {
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  const root = document.documentElement
  const previous = root.getAttribute('data-theme')
  const card = document.body.appendChild(document.createElement('div'))
  const target = document.body.appendChild(document.createElement('div'))
  card.className = 'drag-drop-example-card'
  target.className = 'drag-drop-example-target'
  card.style.transition = 'none'
  target.style.transition = 'none'
  try {
    root.dataset.theme = 'light'
    const cardLight = getComputedStyle(card).backgroundColor
    const targetLight = getComputedStyle(target).backgroundColor
    root.dataset.theme = 'dark'
    expect(getComputedStyle(card).backgroundColor).not.toBe(cardLight)
    expect(getComputedStyle(target).backgroundColor).not.toBe(targetLight)
    const darkBorder = getComputedStyle(target).borderColor
    const darkContent = getComputedStyle(target).color
    target.dataset.theme = 'dark'
    expect(getComputedStyle(target).borderColor).toBe(darkBorder)
    expect(getComputedStyle(target).color).toBe(darkContent)
  } finally {
    if (previous === null) root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', previous)
    card.remove()
    target.remove()
    style.remove()
  }
})
