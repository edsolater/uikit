/**
 * 结构覆盖层显示活组件的真实边界与用途。
 *
 * 单层淡化与独立标注覆盖当前像素，隐藏选择不改写原样式来源或事件。
 *
 * 只在查看开启期间测量，避免普通界面承担持续绘制开销。
 */
import { createState, createRenderEffect, onCleanup, onMount, val, For } from '@/foundation'
import { useBrowserAnimationFrame } from '@/hooks/useBrowserAnimationFrame'
import { Piv } from '@/components/Piv/Piv'
import { componentBoundaries, type ComponentBoundary } from './ComponentWrapper'
import './StructureView.style'

/** 一帧中的真实边界，单位为视口像素。 */
interface BoundaryFrame {
  boundary: ComponentBoundary
  rectangles: DOMRect[]
}

/** 共用同一真实框的组件标注，在框内依次排列。 */
interface BoundaryLabels {
  rectangle: DOMRect
  frames: BoundaryFrame[]
}

const boundaryColors = ['#758c9f', '#72928e', '#8c829d', '#818b96']

/**
 * 在原生顶层绘制结构，保留底层控件的点击、焦点与原生浮层行为。
 */
export function StructureViewOverlay(props: { control: HTMLButtonElement }) {
  let surface!: HTMLDivElement
  let canvas!: HTMLCanvasElement
  const frames = createState<BoundaryFrame[]>([])
  const animationFrame = useBrowserAnimationFrame()
  const displayValues = new Map<ComponentBoundary, boolean>()
  const hiddenElements = new Set<Element>()
  const hiddenText = new Highlight()

  /**
   * 读取当前真实位置并安排下一帧，跟随滚动、布局与动态子树。
   */
  const updateFrame = () => {
    const currentFrames = readBoundaryFrames()
    const hiddenFrames = currentFrames.filter(frame => displayValues.get(frame.boundary) === false)
    const nextHiddenElements = new Set<Element>()
    hiddenText.clear()
    for (const frame of hiddenFrames) {
      for (const node of readBoundaryNodes(frame.boundary)) {
        if (node instanceof Element) {
          nextHiddenElements.add(node)
          for (const surface of node.querySelectorAll('[popover]:popover-open,dialog:modal')) nextHiddenElements.add(surface)
        } else if (node instanceof Text) {
          const range = document.createRange()
          range.selectNodeContents(node)
          hiddenText.add(range)
        }
      }
    }
    for (const element of hiddenElements) {
      if (!nextHiddenElements.has(element)) element.removeAttribute('data-structure-view-hidden')
    }
    hiddenElements.clear()
    for (const element of nextHiddenElements) {
      element.setAttribute('data-structure-view-hidden', '')
      hiddenElements.add(element)
    }
    drawBoundaries(canvas, readDisplayedFrames(currentFrames, displayValues), props.control)
    frames.set(currentFrames)
    animationFrame.request(updateFrame)
  }

  /**
   * 新浮层开启后把查看层恢复到其上方，不改变业务浮层的开关状态。
   */
  const followPopover = (event: Event) => {
    if (event.target === surface || !(event.target instanceof HTMLElement)) return
    if ((event as ToggleEvent).newState !== 'open') return
    surface.hidePopover()
    surface.showPopover()
  }

  onMount(() => {
    surface.showPopover()
    CSS.highlights.set('uikit-structure-view-hidden', hiddenText)
    document.addEventListener('toggle', followPopover, true)
    animationFrame.request(updateFrame)
  })
  onCleanup(() => {
    document.removeEventListener('toggle', followPopover, true)
    for (const element of hiddenElements) element.removeAttribute('data-structure-view-hidden')
    if (CSS.highlights.get('uikit-structure-view-hidden') === hiddenText) CSS.highlights.delete('uikit-structure-view-hidden')
  })

  return <Piv class="StructureViewOverlay" htmlProps={{ popover: 'manual', 'aria-hidden': 'true' }}
    ref={element => { surface = element }}>
    <Piv as="canvas" ref={element => { canvas = element }} />
    <For each={val(frames).map(frame => frame.boundary)}>{boundary => {
      createRenderEffect(boundary.readDescriptionDisplay, display => { displayValues.set(boundary, display) })
      onCleanup(() => displayValues.delete(boundary))
      return undefined
    }}</For>
    <For each={groupBoundaryLabels(readDisplayedFrames(val(frames), displayValues))}>{group => <Piv class="labels" style={{
      left: `${group.rectangle.left}px`, top: `${group.rectangle.top}px`,
      width: `${group.rectangle.width}px`, 'max-height': `${group.rectangle.height}px`,
    }}>
      <For each={group.frames}>{frame => <Piv as="span" class="label">
        {frame.boundary.readLabel()}
      </Piv>}</For>
    </Piv>}</For>
  </Piv>
}

/** false范围同时压住自身与其中的子组件；待定来源不绘制。 */
function readDisplayedFrames(frames: BoundaryFrame[], displayValues: Map<ComponentBoundary, boolean>): BoundaryFrame[] {
  const hiddenRanges = frames.filter(frame => displayValues.get(frame.boundary) === false).map(frame => {
    const range = document.createRange()
    range.setStartBefore(frame.boundary.start)
    range.setEndAfter(frame.boundary.end)
    return range
  })
  return frames.filter(frame => displayValues.get(frame.boundary) === true
    && !hiddenRanges.some(range => range.comparePoint(frame.boundary.start, 0) === 0))
}

/**
 * 对所有真实范围统一淡化一次，再画清晰的冷灰描边。
 * 同一像素即使属于多个嵌套组件，也不会叠加透明度。
 */
function drawBoundaries(canvas: HTMLCanvasElement, frames: BoundaryFrame[], control: HTMLButtonElement) {
  const bounds = canvas.getBoundingClientRect()
  const pixelRatio = window.devicePixelRatio
  const width = Math.round(bounds.width * pixelRatio)
  const height = Math.round(bounds.height * pixelRatio)
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
  const context = canvas.getContext('2d')!
  const horizontalScale = width / bounds.width
  const verticalScale = height / bounds.height
  context.setTransform(horizontalScale, 0, 0, verticalScale, -bounds.x * horizontalScale, -bounds.y * verticalScale)
  context.clearRect(bounds.x, bounds.y, bounds.width, bounds.height)
  const contentPath = new Path2D()
  for (const frame of frames) {
    for (const rectangle of frame.rectangles) {
      contentPath.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height)
    }
  }
  context.fillStyle = 'Canvas'
  context.globalAlpha = 0.76
  context.fill(contentPath)
  context.globalAlpha = 1
  context.lineWidth = 1.5
  for (const frame of frames) {
    context.strokeStyle = boundaryColors[frame.boundary.colorIndex]
    for (const rectangle of frame.rectangles) {
      context.strokeRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height)
    }
  }
  const controlBounds = control.getBoundingClientRect()
  context.clearRect(controlBounds.x - 2, controlBounds.y - 2, controlBounds.width + 4, controlBounds.height + 4)
}

/**
 * 将存活组件的可见真实范围转换成一帧画框。
 */
function readBoundaryFrames(): BoundaryFrame[] {
  const frames: BoundaryFrame[] = []
  for (const boundary of componentBoundaries) {
    if (!boundary.start.isConnected || boundary.start.parentNode !== boundary.end.parentNode) continue
    const rectangles = readBoundaryRectangles(boundary)
      .filter(rectangle => rectangle.width > 0 && rectangle.height > 0
        && rectangle.bottom > 0 && rectangle.right > 0
        && rectangle.top < window.innerHeight && rectangle.left < window.innerWidth)
    frames.push({ boundary, rectangles })
  }
  return frames
}

/**
 * 将共根组件的标注放入同一框内排版，长说明换行并在真实框内裁切。
 */
function groupBoundaryLabels(frames: BoundaryFrame[]): BoundaryLabels[] {
  const groups = new Map<string, BoundaryLabels>()
  for (const frame of frames) {
    const rectangle = frame.rectangles[0]
    if (!rectangle) continue
    const key = `${rectangle.x},${rectangle.y},${rectangle.width},${rectangle.height}`
    const group = groups.get(key)
    if (group) group.frames.push(frame)
    else groups.set(key, { rectangle, frames: [frame] })
  }
  return [...groups.values()]
}

/**
 * 读取哨兵间的元素与文本；原生浮层单独保留其视口位置。
 */
function readBoundaryRectangles(boundary: ComponentBoundary): DOMRect[] {
  const rectangles: DOMRect[] = []
  for (const current of readBoundaryNodes(boundary)) {
    if (current instanceof Element) {
      rectangles.push(...current.getClientRects())
      for (const popover of current.querySelectorAll('[popover]:popover-open')) {
        rectangles.push(...popover.getClientRects())
      }
    } else if (current instanceof Text && current.textContent?.trim()) {
      const range = document.createRange()
      range.selectNodeContents(current)
      rectangles.push(...range.getClientRects())
    }
  }
  return rectangles
}

/** 只收集边界内的真实直接根，保留表格、选项和裸文本的原结构。 */
function readBoundaryNodes(boundary: ComponentBoundary): Node[] {
  if (!boundary.start.isConnected || boundary.start.parentNode !== boundary.end.parentNode) return []
  const nodes: Node[] = []
  let current = boundary.start.nextSibling
  while (current && current !== boundary.end) {
    nodes.push(current)
    current = current.nextSibling
  }
  return nodes
}
