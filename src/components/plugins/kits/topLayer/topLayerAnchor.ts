/**
 * Top Layer 提升前留在原布局中的影子，同时也是尺寸 Anchor。
 *
 * 原元素进入 Top Layer 后不再占据普通布局槽位；影子接替该槽位，并通过
 * CSS Anchor Positioning 把布局计算得到的 border-box 尺寸提供给原元素。
 */
export interface TopLayerAnchor {
  name: string
  remove(): void
}

interface LogicalSize {
  inline: number
  block: number
}

interface InlineDeclaration {
  property: string
  value: string
  priority: string
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

/** 影子直接继承原元素算出的轮廓，不为 Top Layer 另造固定形状。 */
const shapeProperties = [
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'corner-top-left-shape',
  'corner-top-right-shape',
  'corner-bottom-right-shape',
  'corner-bottom-left-shape',
  'border-shape',
] as const

export function createTopLayerAnchor(source: HTMLElement): TopLayerAnchor {
  const ownerDocument = source.ownerDocument
  const ownerWindow = ownerDocument.defaultView
  if (!ownerWindow) throw new Error('Top Layer 元素必须属于浏览器窗口')

  const sourceStyle = ownerWindow.getComputedStyle(source)
  const sourceSize = readBorderBoxSize(source, sourceStyle)
  const naturalSize = readNaturalSize(source, sourceSize)
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
  copyComputedProperties(sourceStyle, anchor.style, shapeProperties)
  source.before(anchor)

  preserveLayoutSize(anchor, sourceSize, naturalSize)

  return {
    name,
    remove() {
      anchor.remove()
    },
  }
}

/**
 * Anchor 用自然尺寸参与父级排布，再继续承接 Grid/Flex 分配的伸缩空间。
 * 直接把伸缩后的最终尺寸写回布局，会把上一次布局输出变成下一次布局输入。
 */
function preserveLayoutSize(
  anchor: HTMLElement,
  sourceSize: LogicalSize,
  naturalSize: LogicalSize,
): void {
  const style = anchor.ownerDocument.defaultView!.getComputedStyle(anchor)
  const inlineEdges = readEdges([
    style.paddingInlineStart,
    style.paddingInlineEnd,
    style.borderInlineStartWidth,
    style.borderInlineEndWidth,
  ])
  const blockEdges = readEdges([
    style.paddingBlockStart,
    style.paddingBlockEnd,
    style.borderBlockStartWidth,
    style.borderBlockEndWidth,
  ])

  anchor.style.contain = 'size'
  anchor.style.containIntrinsicInlineSize = `${Math.max(0, naturalSize.inline - inlineEdges)}px`
  anchor.style.containIntrinsicBlockSize = `${Math.max(0, naturalSize.block - blockEdges)}px`

  if (sizeChanged(sourceSize.inline, naturalSize.inline)) anchor.style.inlineSize = 'auto'
  if (sizeChanged(sourceSize.block, naturalSize.block)) anchor.style.blockSize = 'auto'
}

/**
 * 读取元素没有接受 Grid/Flex 剩余空间时的尺寸。
 * 测量只在当前同步任务中临时改变自身排布输入，浏览器绘制前即完整恢复。
 */
function readNaturalSize(source: HTMLElement, sourceSize: LogicalSize): LogicalSize {
  const ownerWindow = source.ownerDocument.defaultView!
  const parent = source.parentElement
  if (!parent) return sourceSize

  const parentStyle = ownerWindow.getComputedStyle(parent)
  if (parentStyle.display.includes('grid')) {
    return {
      inline: measureSize(source, { 'justify-self': 'start' }).inline,
      block: measureSize(source, { 'align-self': 'start' }).block,
    }
  }

  if (parentStyle.display.includes('flex')) {
    const baseSize = measureSize(source, {
      'flex-grow': '0',
      'flex-shrink': '0',
      'flex-basis': 'auto',
    })
    const crossSize = measureSize(source, { 'align-self': 'start' })
    const mainAxisIsInline = parentStyle.flexDirection.startsWith('row')

    return mainAxisIsInline
      ? { inline: baseSize.inline, block: crossSize.block }
      : { inline: crossSize.inline, block: baseSize.block }
  }

  return sourceSize
}

function measureSize(
  source: HTMLElement,
  declarations: Readonly<Record<string, string>>,
): LogicalSize {
  const previousDeclarations = Object.keys(declarations).map(property => ({
    property,
    value: source.style.getPropertyValue(property),
    priority: source.style.getPropertyPriority(property),
  }))

  for (const [property, value] of Object.entries(declarations)) {
    source.style.setProperty(property, value, 'important')
  }

  const style = source.ownerDocument.defaultView!.getComputedStyle(source)
  const size = readBorderBoxSize(source, style)
  restoreInlineDeclarations(source.style, previousDeclarations)
  return size
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

function readEdges(edges: string[]): number {
  return edges.reduce((total, edge) => total + (readResolvedSize(edge) ?? 0), 0)
}

function sizeChanged(current: number, natural: number): boolean {
  return Math.abs(current - natural) >= 0.1
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

function restoreInlineDeclarations(
  style: CSSStyleDeclaration,
  declarations: InlineDeclaration[],
): void {
  for (const { property, value, priority } of declarations) {
    if (value) style.setProperty(property, value, priority)
    else style.removeProperty(property)
  }
}
