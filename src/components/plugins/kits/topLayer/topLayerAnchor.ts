/**
 * Top Layer 提升前留在原布局中的几何 Anchor。
 *
 * 原元素进入 Top Layer 后不再占据普通布局槽位；Anchor 接替该槽位，并把
 * 布局计算得到的 border-box 尺寸提供给提升后的原元素。
 */
export interface TopLayerAnchor {
  name: string
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

export function createTopLayerAnchor(source: HTMLElement): TopLayerAnchor {
  const ownerDocument = source.ownerDocument
  const ownerWindow = ownerDocument.defaultView
  if (!ownerWindow) throw new Error('Top Layer 元素必须属于浏览器窗口')

  const sourceStyle = ownerWindow.getComputedStyle(source)
  const sourceSize = readBorderBoxSize(source, sourceStyle)
  const anchor = ownerDocument.createElement('div')
  const name = `--uikit-top-layer-anchor-${++anchorSequence}`

  anchor.className = 'top-layer-anchor'
  anchor.setAttribute('aria-hidden', 'true')
  anchor.inert = true
  anchor.style.setProperty('anchor-name', name)
  copyComputedProperties(sourceStyle, anchor.style, layoutProperties)
  anchor.style.boxSizing = 'border-box'
  anchor.style.inlineSize = `${sourceSize.inline}px`
  anchor.style.blockSize = `${sourceSize.block}px`
  anchor.style.borderTopLeftRadius = sourceStyle.borderTopLeftRadius
  anchor.style.borderTopRightRadius = sourceStyle.borderTopRightRadius
  anchor.style.borderBottomRightRadius = sourceStyle.borderBottomRightRadius
  anchor.style.borderBottomLeftRadius = sourceStyle.borderBottomLeftRadius
  source.before(anchor)

  return {
    name,
    remove() {
      anchor.remove()
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
