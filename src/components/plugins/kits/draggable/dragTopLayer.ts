/**
 * Drag source 的 Top Layer 显示事务。
 *
 * source 始终留在原 DOM 位置；Popover API 只把它生成的 box 提升到浏览器 Top Layer，
 * 尺寸则通过 Placeholder 的 anchor-size() 延续原布局结果。
 */
import { createDragPlaceholder } from './dragPlaceholder'

export interface DragTopLayer {
  leave(): void
}

interface InlineDeclaration {
  property: string
  value: string
  priority: string
}

const computedPresentationProperties = [
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-right-width',
  'border-right-style',
  'border-right-color',
  'border-bottom-width',
  'border-bottom-style',
  'border-bottom-color',
  'border-left-width',
  'border-left-style',
  'border-left-color',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'overflow-x',
  'overflow-y',
  'color',
  'background-color',
  'background-image',
  'background-position-x',
  'background-position-y',
  'background-size',
  'background-repeat',
  'background-attachment',
  'background-origin',
  'background-clip',
] as const

const presentationProperties = [
  'display',
  'position',
  'left',
  'top',
  'right',
  'bottom',
  'box-sizing',
  'inline-size',
  'block-size',
  'min-inline-size',
  'min-block-size',
  'max-inline-size',
  'max-block-size',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  ...computedPresentationProperties,
] as const

export function enterDragTopLayer(source: HTMLElement): DragTopLayer {
  if (source.hasAttribute('popover')) {
    throw new Error('Draggable 来源元素不能同时承担 Popover')
  }

  const ownerWindow = source.ownerDocument.defaultView
  if (!ownerWindow) throw new Error('Draggable 来源元素必须属于浏览器窗口')

  const sourceRect = source.getBoundingClientRect()
  const sourceStyle = ownerWindow.getComputedStyle(source)
  const display = sourceStyle.display
  const computedDeclarations = captureComputedDeclarations(
    sourceStyle,
    computedPresentationProperties,
  )
  const previousDeclarations = captureInlineDeclarations(source.style, presentationProperties)
  const placeholder = createDragPlaceholder(source)

  applyTopLayerPresentation(
    source.style,
    sourceRect,
    display,
    computedDeclarations,
    placeholder.anchorName,
  )
  source.setAttribute('popover', 'manual')

  try {
    source.showPopover()
    alignRenderedBox(source, sourceRect)
  } catch (error) {
    source.removeAttribute('popover')
    restoreInlineDeclarations(source.style, previousDeclarations)
    placeholder.remove()
    throw error
  }

  return {
    leave() {
      if (source.matches(':popover-open')) source.hidePopover()
      source.removeAttribute('popover')
      restoreInlineDeclarations(source.style, previousDeclarations)
      placeholder.remove()
    },
  }
}

function applyTopLayerPresentation(
  target: CSSStyleDeclaration,
  sourceRect: DOMRect,
  display: string,
  computedDeclarations: ReadonlyMap<string, string>,
  anchorName: string,
): void {
  target.setProperty('display', display)
  target.setProperty('position', 'fixed')
  target.setProperty('left', `${sourceRect.left}px`)
  target.setProperty('top', `${sourceRect.top}px`)
  target.setProperty('right', 'auto')
  target.setProperty('bottom', 'auto')
  target.setProperty('box-sizing', 'border-box')
  target.setProperty('inline-size', `anchor-size(${anchorName} self-inline)`)
  target.setProperty('block-size', `anchor-size(${anchorName} self-block)`)
  target.setProperty('min-inline-size', '0')
  target.setProperty('min-block-size', '0')
  target.setProperty('max-inline-size', 'none')
  target.setProperty('max-block-size', 'none')
  target.setProperty('margin-top', '0')
  target.setProperty('margin-right', '0')
  target.setProperty('margin-bottom', '0')
  target.setProperty('margin-left', '0')

  for (const property of computedPresentationProperties) {
    target.setProperty(property, computedDeclarations.get(property) ?? '')
  }
}

function alignRenderedBox(source: HTMLElement, originalRect: DOMRect): void {
  const renderedRect = source.getBoundingClientRect()
  const leftCorrection = originalRect.left - renderedRect.left
  const topCorrection = originalRect.top - renderedRect.top
  source.style.left = `${originalRect.left + leftCorrection}px`
  source.style.top = `${originalRect.top + topCorrection}px`
}

function captureComputedDeclarations(
  style: CSSStyleDeclaration,
  properties: readonly string[],
): ReadonlyMap<string, string> {
  return new Map(properties.map(property => [property, style.getPropertyValue(property)]))
}

function captureInlineDeclarations(
  style: CSSStyleDeclaration,
  properties: readonly string[],
): InlineDeclaration[] {
  return properties.map(property => ({
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
