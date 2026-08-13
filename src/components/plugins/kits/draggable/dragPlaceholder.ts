/**
 * Drag 原位置的空几何标记。
 *
 * 它在 source 进入 Top Layer 后接替原来的布局槽位，不复制组件内容、身份或状态。
 */
export interface DragPlaceholder {
  anchorName: string
  remove(): void
}

let anchorSequence = 0

const layoutProperties = [
  'display',
  'position',
  'inset',
  'margin-block-start',
  'margin-block-end',
  'margin-inline-start',
  'margin-inline-end',
  'align-self',
  'justify-self',
  'order',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'grid-column-start',
  'grid-column-end',
  'grid-row-start',
  'grid-row-end',
] as const

export function createDragPlaceholder(source: HTMLElement): DragPlaceholder {
  const ownerDocument = source.ownerDocument
  const ownerWindow = ownerDocument.defaultView
  if (!ownerWindow) throw new Error('Draggable 来源元素必须属于浏览器窗口')

  const sourceStyle = ownerWindow.getComputedStyle(source)
  const sourceSize = readBorderBoxSize(source, sourceStyle)
  const placeholder = ownerDocument.createElement('div')
  const anchorName = `--uikit-drag-placeholder-${++anchorSequence}`

  placeholder.className = 'drag-placeholder'
  placeholder.setAttribute('aria-hidden', 'true')
  placeholder.inert = true
  placeholder.style.setProperty('anchor-name', anchorName)
  copyComputedProperties(sourceStyle, placeholder.style, layoutProperties)
  placeholder.style.boxSizing = 'border-box'
  placeholder.style.inlineSize = `${sourceSize.inline}px`
  placeholder.style.blockSize = `${sourceSize.block}px`
  placeholder.style.borderTopLeftRadius = sourceStyle.borderTopLeftRadius
  placeholder.style.borderTopRightRadius = sourceStyle.borderTopRightRadius
  placeholder.style.borderBottomRightRadius = sourceStyle.borderBottomRightRadius
  placeholder.style.borderBottomLeftRadius = sourceStyle.borderBottomLeftRadius
  source.before(placeholder)

  return {
    anchorName,
    remove() {
      placeholder.remove()
    },
  }
}

function readBorderBoxSize(
  source: HTMLElement,
  style: CSSStyleDeclaration,
): { inline: number; block: number } {
  const inline = readResolvedSize(style.inlineSize)
  const block = readResolvedSize(style.blockSize)
  const horizontalWritingMode = style.writingMode.startsWith('horizontal')

  return {
    inline: resolveBorderBoxSize(
      inline,
      horizontalWritingMode ? source.offsetWidth : source.offsetHeight,
      style.boxSizing,
      [
        style.paddingInlineStart,
        style.paddingInlineEnd,
        style.borderInlineStartWidth,
        style.borderInlineEndWidth,
      ],
    ),
    block: resolveBorderBoxSize(
      block,
      horizontalWritingMode ? source.offsetHeight : source.offsetWidth,
      style.boxSizing,
      [
        style.paddingBlockStart,
        style.paddingBlockEnd,
        style.borderBlockStartWidth,
        style.borderBlockEndWidth,
      ],
    ),
  }
}

function readResolvedSize(value: string): number | undefined {
  return value.endsWith('px') ? Number.parseFloat(value) : undefined
}

function resolveBorderBoxSize(
  resolvedSize: number | undefined,
  fallbackSize: number,
  boxSizing: string,
  edges: string[],
): number {
  if (resolvedSize === undefined) return fallbackSize
  return addBoxEdges(resolvedSize, boxSizing, edges)
}

function addBoxEdges(size: number, boxSizing: string, edges: string[]): number {
  if (boxSizing === 'border-box') return size
  return edges.reduce((total, edge) => total + (readResolvedSize(edge) ?? 0), size)
}

function copyComputedProperties(
  source: CSSStyleDeclaration,
  target: CSSStyleDeclaration,
  properties: readonly string[],
): void {
  for (const property of properties) {
    target.setProperty(property, source.getPropertyValue(property))
  }
}
