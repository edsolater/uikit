/**
 * 一次 Drag 的显示协调。
 *
 * Placeholder 服务原布局，Top Layer 服务原始 source；本文件只决定 Drag
 * 何时使用两项能力，以及怎样保持拖动激活瞬间的几何位置。
 */
import { enterTopLayer, type TopLayerEntry } from '../topLayer'
import { createDragPlaceholder } from './dragPlaceholder'

export interface DragPresentation {
  leave(): void
}

interface InlineDeclaration {
  property: string
  value: string
  priority: string
}

/**
 * Drag 临时接管的 inline 几何声明。
 *
 * 这些属性只负责把 source 固定在原 border-box 上。display、margin 与
 * min/max 继续由 source 自己的 CSS 决定，Drag 不读取也不改写。
 */
const dragGeometryProperties = [
  'position',
  'left',
  'top',
  'right',
  'bottom',
  'box-sizing',
  'inline-size',
  'block-size',
] as const

export function enterDragPresentation(source: HTMLElement): DragPresentation {
  if (!source.ownerDocument.defaultView) {
    throw new Error('Draggable 来源元素必须属于浏览器窗口')
  }

  const sourceRect = source.getBoundingClientRect()
  const previousDeclarations = captureInlineDeclarations(source.style)
  const placeholder = createDragPlaceholder(source)
  let topLayer: TopLayerEntry

  applyDragGeometry(source.style, sourceRect, placeholder.anchorName)

  try {
    topLayer = enterTopLayer(source)
    alignRenderedBox(source, sourceRect)
  } catch (error) {
    restoreInlineDeclarations(source.style, previousDeclarations)
    placeholder.remove()
    throw error
  }

  return {
    leave() {
      topLayer.leave()
      restoreInlineDeclarations(source.style, previousDeclarations)
      placeholder.remove()
    },
  }
}

function applyDragGeometry(
  style: CSSStyleDeclaration,
  sourceRect: DOMRect,
  anchorName: string,
): void {
  // Drag 只冻结本次会话的视口起点。right/bottom 必须回到 auto，
  // 否则 Popover 的 UA inset: 0 会让 source 同时受到两侧约束并自动居中。
  style.setProperty('position', 'fixed')
  style.setProperty('left', `${sourceRect.left}px`)
  style.setProperty('top', `${sourceRect.top}px`)
  style.setProperty('right', 'auto')
  style.setProperty('bottom', 'auto')

  // Placeholder 的 anchor box 是原槽位的 border-box；source 也按 border-box
  // 解释同一尺寸，避免 padding 与 border 再把外框撑大。
  style.setProperty('box-sizing', 'border-box')
  style.setProperty('inline-size', `anchor-size(${anchorName} self-inline)`)
  style.setProperty('block-size', `anchor-size(${anchorName} self-block)`)
}

/**
 * source 进入 Top Layer 后重新测量一次，只修正升层造成的视口偏移。
 * margin、display 与尺寸约束仍由 source CSS 决定，不属于 Drag 的事务。
 */
function alignRenderedBox(source: HTMLElement, originalRect: DOMRect): void {
  const renderedRect = source.getBoundingClientRect()
  source.style.left = `${originalRect.left * 2 - renderedRect.left}px`
  source.style.top = `${originalRect.top * 2 - renderedRect.top}px`
}

function captureInlineDeclarations(style: CSSStyleDeclaration): InlineDeclaration[] {
  return dragGeometryProperties.map(property => ({
    property,
    value: style.getPropertyValue(property),
    priority: style.getPropertyPriority(property),
  }))
}

function restoreInlineDeclarations(
  style: CSSStyleDeclaration,
  declarations: InlineDeclaration[],
): void {
  for (const { property, value, priority } of declarations) {
    if (value) style.setProperty(property, value, priority)
    else style.removeProperty(property)
  }
}
