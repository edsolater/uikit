/**
 * 页面内拖动的视觉副本。
 *
 * 副本挂到 body 以脱离来源布局和层叠上下文，只用 transform 跟随指针；复制出的
 * DOM 不继承页面身份，避免与来源元素产生重复 id 或测试定位标记。
 */
import type { DragPoint } from '../dragAndDrop'

export interface DragPreview {
  move(point: DragPoint): void
  remove(): void
}

export function createDragPreview(
  source: HTMLElement,
  origin: DragPoint,
): DragPreview {
  const rect = source.getBoundingClientRect()
  const preview = source.cloneNode(true) as HTMLElement

  removeDocumentIdentity(preview)
  preview.classList.add('drag-preview')
  preview.removeAttribute('data-dragging')
  preview.setAttribute('aria-hidden', 'true')
  preview.inert = true
  preview.style.position = 'fixed'
  preview.style.inset = `${rect.top}px auto auto ${rect.left}px`
  preview.style.inlineSize = `${rect.width}px`
  preview.style.blockSize = `${rect.height}px`
  preview.style.margin = '0'
  preview.style.transition = 'none'
  preview.style.transform = 'translate3d(0, 0, 0)'
  document.body.append(preview)

  return {
    move(point) {
      preview.style.transform = `translate3d(${point.x - origin.x}px, ${point.y - origin.y}px, 0)`
    },
    remove() {
      preview.remove()
    },
  }
}

function removeDocumentIdentity(preview: HTMLElement): void {
  preview.removeAttribute('id')
  preview.removeAttribute('data-testid')

  for (const element of preview.querySelectorAll<HTMLElement>('[id], [data-testid]')) {
    element.removeAttribute('id')
    element.removeAttribute('data-testid')
  }
}
