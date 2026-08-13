/**
 * 页面内 Pointer 拖动事务。
 *
 * 【职责边界】持有从按下到放下或取消的一次指针交互，移动来源元素并取得
 * Droppable 命中；系统外部材料由 Droppable 的原生事件入口接收。
 */
import {
  createInternalDrag,
  findInternalDropTarget,
  type DragPoint,
  type InternalDrag,
  type InternalDropMatch,
} from '../dragAndDrop'
import { enterDragPresentation, type DragPresentation } from './dragPresentation'

export interface PointerDragOptions {
  source: HTMLElement
  payload: unknown
  activationDistance: number
  enabled(): boolean
  onDraggingChange(dragging: boolean): void
}

export interface PointerDrag {
  start(event: PointerEvent): void
  moving(event: PointerEvent): void
  end(event: PointerEvent): void
  cancel(event?: PointerEvent): void
}

interface PointerInteraction {
  pointerId: number
  origin: DragPoint
  /** 本次交互独占的全局事件生命周期。 */
  events: AbortController
  /** undefined 表示已经按下，但尚未越过激活距离。 */
  active: ActiveDrag | undefined
  dropMatch: InternalDropMatch | undefined
}

interface ActiveDrag {
  drag: InternalDrag
  presentation: DragPresentation
  translation: DragPoint
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
    assertSourceTranslateAvailable(this.options.source)
    event.stopPropagation()
    this.options.source.setPointerCapture(event.pointerId)
    const interaction: PointerInteraction = {
      pointerId: event.pointerId,
      origin: pointOf(event),
      events: this.listenToPointer(),
      active: undefined,
      dropMatch: undefined,
    }
    this.interaction = interaction

    if (this.options.activationDistance === 0) {
      this.activate(interaction, interaction.origin)
      event.preventDefault()
    }
  }

  moving = (event: PointerEvent): void => {
    const interaction = this.match(event)
    if (!interaction) return

    const point = pointOf(event)
    if (!interaction.active) {
      if (distance(interaction.origin, point) < this.options.activationDistance) return
      this.activate(interaction, point)
    } else {
      this.moveSource(interaction, point)
    }

    event.preventDefault()
    this.updateDropTarget(interaction, event)
  }

  end = (event: PointerEvent): void => {
    const interaction = this.match(event)
    if (!interaction) return

    const active = interaction.active
    if (!active) {
      this.clear()
      return
    }

    event.preventDefault()
    this.moveSource(interaction, pointOf(event))
    this.updateDropTarget(interaction, event)
    const acceptedTarget = interaction.dropMatch?.acceptable
      ? interaction.dropMatch.target
      : undefined

    // 先恢复 source 并释放 Placeholder、悬停和 Pointer Capture；onDrop 随后可以立即改动 DOM。
    this.clear()
    acceptedTarget?.drop(active.drag, event)
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
    let presentation: DragPresentation
    try {
      presentation = enterDragPresentation(this.options.source)
    } catch (error) {
      this.clear()
      throw error
    }

    interaction.active = {
      drag: createInternalDrag(this.options.source, this.options.payload),
      presentation,
      translation: { x: 0, y: 0 },
    }
    this.options.onDraggingChange(true)
    this.moveSource(interaction, point)
  }

  private moveSource(interaction: PointerInteraction, point: DragPoint): void {
    const active = interaction.active
    if (!active) return

    active.translation = {
      x: point.x - interaction.origin.x,
      y: point.y - interaction.origin.y,
    }
    this.options.source.style.setProperty('--drag-x', `${active.translation.x}px`)
    this.options.source.style.setProperty('--drag-y', `${active.translation.y}px`)
  }

  private updateDropTarget(interaction: PointerInteraction, event: PointerEvent): void {
    const drag = interaction.active?.drag
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

  /**
   * 一次拖动离开单个元素的事件边界，因此后续事件由所属页面统一接管。
   * Pointer Capture 保留浏览器语义，Window 监听负责会话生命周期。
   */
  private listenToPointer(): AbortController {
    const ownerWindow = this.options.source.ownerDocument.defaultView
    if (!ownerWindow) throw new Error('Draggable 来源元素必须属于浏览器窗口')

    const events = new ownerWindow.AbortController()
    const listenerOptions = {
      capture: true,
      passive: false,
      signal: events.signal,
    } satisfies AddEventListenerOptions

    ownerWindow.addEventListener('pointermove', this.moving, listenerOptions)
    ownerWindow.addEventListener('pointerup', this.end, listenerOptions)
    ownerWindow.addEventListener('pointercancel', this.cancel, listenerOptions)
    this.options.source.addEventListener('lostpointercapture', this.cancel, listenerOptions)
    return events
  }

  private clear(): void {
    const interaction = this.interaction
    if (!interaction) return
    this.interaction = undefined
    interaction.events.abort()

    interaction.dropMatch?.target.leave()
    interaction.active?.presentation.leave()
    this.options.source.style.removeProperty('--drag-x')
    this.options.source.style.removeProperty('--drag-y')

    if (this.options.source.hasPointerCapture(interaction.pointerId)) {
      this.options.source.releasePointerCapture(interaction.pointerId)
    }
    if (interaction.active) this.options.onDraggingChange(false)
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

function assertSourceTranslateAvailable(source: HTMLElement): void {
  const ownerWindow = source.ownerDocument.defaultView
  if (!ownerWindow) throw new Error('Draggable 来源元素必须属于浏览器窗口')

  if (ownerWindow.getComputedStyle(source).translate !== 'none') {
    throw new Error('Draggable 来源元素不能预先占用 CSS translate')
  }
}
