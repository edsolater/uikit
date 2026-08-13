/**
 * 页面内 Pointer 拖动事务。
 *
 * 【职责边界】持有从按下到放下或取消的一次指针交互，驱动视觉副本并取得
 * Droppable 命中；系统外部材料由 Droppable 的原生事件入口接收。
 */
import {
  createInternalDrag,
  findInternalDropTarget,
  type DragPoint,
  type InternalDrag,
  type InternalDropMatch,
} from '../dragAndDrop'
import { createDragPreview, type DragPreview } from './dragPreview'

export interface PointerDragOptions {
  source: HTMLElement
  payload: unknown
  activationDistance: number
  enabled(): boolean
  onDraggingChange(dragging: boolean): void
}

export interface PointerDrag {
  start(event: PointerEvent): void
  move(event: PointerEvent): void
  finish(event: PointerEvent): void
  cancel(event?: PointerEvent): void
}

interface PointerInteraction {
  pointerId: number
  origin: DragPoint
  /** undefined 表示已经按下，但尚未越过激活距离。 */
  drag: InternalDrag | undefined
  preview: DragPreview | undefined
  dropMatch: InternalDropMatch | undefined
}

const interactiveSelector = 'button, input, select, textarea, a, [contenteditable="true"]'

export function createPointerDrag(options: PointerDragOptions): PointerDrag {
  return new PointerDragSession(options)
}

/** 每个 Draggable 独占一个会话，同一时刻最多持有一次指针交互。 */
class PointerDragSession implements PointerDrag {
  private interaction: PointerInteraction | undefined

  constructor(private options: PointerDragOptions) {}

  start = (event: PointerEvent): void => {
    if (!this.canStart(event)) return

    this.clear()
    event.stopPropagation()
    this.options.source.setPointerCapture(event.pointerId)
    this.interaction = {
      pointerId: event.pointerId,
      origin: pointOf(event),
      drag: undefined,
      preview: undefined,
      dropMatch: undefined,
    }

    if (this.options.activationDistance === 0) {
      this.activate(this.interaction, this.interaction.origin)
      event.preventDefault()
    }
  }

  move = (event: PointerEvent): void => {
    const interaction = this.match(event)
    if (!interaction) return

    const point = pointOf(event)
    if (!interaction.drag) {
      if (distance(interaction.origin, point) < this.options.activationDistance) return
      this.activate(interaction, point)
    } else {
      interaction.preview?.move(point)
    }

    event.preventDefault()
    this.updateDropTarget(interaction, event)
  }

  finish = (event: PointerEvent): void => {
    const interaction = this.match(event)
    if (!interaction) return

    const drag = interaction.drag
    if (!drag) {
      this.clear()
      return
    }

    event.preventDefault()
    interaction.preview?.move(pointOf(event))
    this.updateDropTarget(interaction, event)
    const acceptedTarget = interaction.dropMatch?.acceptable
      ? interaction.dropMatch.target
      : undefined

    // 先释放预览、悬停和指针捕获；onDrop 随后可以立即修改或移除相关 DOM。
    this.clear()
    acceptedTarget?.drop(drag, event)
  }

  cancel = (event?: PointerEvent): void => {
    if (!event || this.match(event)) this.clear()
  }

  private canStart(event: PointerEvent): boolean {
    return this.options.enabled()
      && event.isPrimary
      && event.button === 0
      && !isInteractiveDescendant(event, this.options.source)
  }

  private activate(interaction: PointerInteraction, point: DragPoint): void {
    interaction.drag = createInternalDrag(this.options.source, this.options.payload)
    interaction.preview = createDragPreview(this.options.source, interaction.origin)
    this.options.source.setAttribute('data-dragging', 'true')
    this.options.onDraggingChange(true)
    interaction.preview.move(point)
  }

  private updateDropTarget(interaction: PointerInteraction, event: PointerEvent): void {
    const drag = interaction.drag
    if (!drag) return

    const nextMatch = findInternalDropTarget(drag, event)
    if (nextMatch?.target !== interaction.dropMatch?.target) {
      interaction.dropMatch?.target.leave()
    }
    interaction.dropMatch = nextMatch
    nextMatch?.target.hover(nextMatch.acceptable)
  }

  private match(event: PointerEvent): PointerInteraction | undefined {
    return this.interaction?.pointerId === event.pointerId ? this.interaction : undefined
  }

  private clear(): void {
    const interaction = this.interaction
    if (!interaction) return
    this.interaction = undefined

    interaction.dropMatch?.target.leave()
    interaction.preview?.remove()
    this.options.source.removeAttribute('data-dragging')
    this.options.onDraggingChange(false)

    if (this.options.source.hasPointerCapture(interaction.pointerId)) {
      this.options.source.releasePointerCapture(interaction.pointerId)
    }
  }
}

function pointOf(event: PointerEvent): DragPoint {
  return { x: event.clientX, y: event.clientY }
}

function distance(origin: DragPoint, point: DragPoint): number {
  return Math.hypot(point.x - origin.x, point.y - origin.y)
}

function isInteractiveDescendant(event: PointerEvent, source: HTMLElement): boolean {
  for (const eventTarget of event.composedPath()) {
    if (eventTarget === source) return false
    if (eventTarget instanceof HTMLElement && eventTarget.matches(interactiveSelector)) return true
  }
  return false
}
