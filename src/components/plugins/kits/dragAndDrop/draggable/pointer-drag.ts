/**
 * 页面内 Pointer 拖动事务。
 *
 * 持有从按下到放下或取消的一次指针交互，移动来源元素并取得 Droppable 命中。
 *
 * 原生事件的捕获、默认行为与事务清理必须在当前指针调用中完成。
 */
import {
  createInternalDrag,
  findInternalDropTarget,
  type DragPoint,
  type InternalDrag,
  type InternalDropMatch,
} from '../../dragSession'
import {
  createTopLayerController,
  type TopLayerController,
} from '../../topLayer/topLayer'

/** 已接入节点的一次拖动配置；激活距离以 CSS px 计。 */
export interface PointerDragOptions {
  target: HTMLElement
  id?: object
  payload: unknown
  activationDistance: number
  activationJump: boolean
  enabled(): boolean
  onDraggingChange(dragging: boolean): void
}

/** 同步指针事务入口，开始、更新、结束与取消共用同一个会话。 */
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
  topLayer: TopLayerController
  compensation: DragPoint
  translation: DragPoint
}

const interactiveSelector =
  'button, input, select, textarea, a, [contenteditable="true"]'

/**
 * 为已接入的来源节点创建同步拖动会话。
 * start 必须在原指针事件中执行，以保留默认行为控制、捕获与同步失败语义。
 */
export function createPointerDrag(options: PointerDragOptions): PointerDrag {
  return new PointerDragSession(options)
}

/**
 * 每个 Draggable 独占一个会话，同一时刻最多持有一次指针交互。
 * 一个实例代表一次完整拖动
 */
class PointerDragSession implements PointerDrag {
  private interaction: PointerInteraction | undefined

  /**
   * 绑定来源节点与本实例的交互规则，尚不开始指针事务。
   */
  constructor(private options: PointerDragOptions) {}

  /**
   * 接受合法主指针按下，建立捕获与会话，达到条件时立即激活拖动。
   */
  start = (event: PointerEvent): void => {
    if (!this.canStart(event)) return

    this.clear()
    assertTargetTranslateAvailable(this.options.target)
    event.stopPropagation()
    this.options.target.setPointerCapture(event.pointerId)
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

  /**
   * 更新同一指针的位移和命中；跨过激活距离时开始移动来源元素。
   */
  moving = (event: PointerEvent): void => {
    const interaction = this.match(event)
    if (!interaction) return

    const point = pointOf(event)
    if (!interaction.active) {
      if (distance(interaction.origin, point) < this.options.activationDistance)
        return
      this.activate(interaction, point)
    } else {
      this.moveSource(interaction, point)
    }

    event.preventDefault()
    this.updateDropTarget(interaction, event)
  }

  /**
   * 结束当前指针事务，先恢复来源元素和捕获，再向可接收目标交付材料。
   */
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

    // 先恢复 source 并结束 Top Layer、悬停和 Pointer Capture；
    // onDrop 随后可以立即改动 DOM。
    this.clear()
    acceptedTarget?.drop(active.drag, event)
  }

  /**
   * 取消指定指针或当前事务，恢复元素和交互状态，不执行放下动作。
   */
  cancel = (event?: PointerEvent): void => {
    if (!event || this.match(event)) this.clear()
  }

  /**
   * 判断本次按下是否由启用的来源主体发起，排除内部独立交互控件。
   */
  private canStart(event: PointerEvent): boolean {
    return (
      this.options.enabled() &&
      event.isPrimary &&
      event.button === 0 &&
      !isInteractiveDescendant(event, this.options.target)
    )
  }

  /**
   * 提升原始来源并建立拖动材料，按阈值规则确定起始位移。
   */
  private activate(interaction: PointerInteraction, point: DragPoint): void {
    const topLayer = createTopLayerController(this.options.target)
    try {
      topLayer.enter()
    } catch (error) {
      this.clear()
      throw error
    }

    interaction.active = {
      drag: createInternalDrag(
        this.options.target,
        this.options.payload,
        this.options.id,
      ),
      topLayer,
      compensation: this.options.activationJump
        ? { x: 0, y: 0 }
        : activationCompensation(
            interaction.origin,
            point,
            this.options.activationDistance,
          ),
      translation: { x: 0, y: 0 },
    }
    this.moveSource(interaction, point)
    // 交互标识须在状态通知和 onDrop 前同步更新；Solid 2 的响应式属性提交会延后，
    // 因此当前由 activate/clear 直接设置和移除，不通过 dragging State 驱动。
    this.options.target.setAttribute('data-interacting', 'true')
    this.options.onDraggingChange(true)
  }

  /**
   * 按当前指针与激活补偿更新来源元素的 CSS 位移。
   */
  private moveSource(interaction: PointerInteraction, point: DragPoint): void {
    const active = interaction.active
    if (!active) return

    active.translation = {
      x: point.x - interaction.origin.x - active.compensation.x,
      y: point.y - interaction.origin.y - active.compensation.y,
    }
    this.options.target.style.setProperty(
      '--drag-x',
      `${active.translation.x}px`,
    )
    this.options.target.style.setProperty(
      '--drag-y',
      `${active.translation.y}px`,
    )
  }

  /**
   * 将当前指针命中交给接收目标，并在切换目标时结束上一份悬停。
   */
  private updateDropTarget(
    interaction: PointerInteraction,
    event: PointerEvent,
  ): void {
    const drag = interaction.active?.drag
    if (!drag) return

    const nextMatch = findInternalDropTarget(drag, event)
    if (nextMatch?.target !== interaction.dropMatch?.target) {
      interaction.dropMatch?.target.leave()
    }
    interaction.dropMatch = nextMatch
    nextMatch?.target.hover(nextMatch.acceptable)
  }

  /**
   * 取得同一 pointerId 的当前事务，其余指针不参与本会话。
   */
  private match(event: PointerEvent): PointerInteraction | undefined {
    return this.interaction?.pointerId === event.pointerId
      ? this.interaction
      : undefined
  }

  /**
   * 一次拖动离开单个元素的事件边界，因此后续事件由所属页面统一接管。
   * Pointer Capture 保留浏览器语义，Window 监听负责会话生命周期。
   */
  private listenToPointer(): AbortController {
    const ownerWindow = this.options.target.ownerDocument.defaultView
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
    this.options.target.addEventListener(
      'lostpointercapture',
      this.cancel,
      listenerOptions,
    )
    return events
  }

  /**
   * 释放本次事务的监听、提升、位移、指针捕获和拖动状态。
   */
  private clear(): void {
    const interaction = this.interaction
    if (!interaction) return
    this.interaction = undefined
    interaction.events.abort()

    interaction.dropMatch?.target.leave()
    interaction.active?.topLayer.leave()
    this.options.target.style.removeProperty('--drag-x')
    this.options.target.style.removeProperty('--drag-y')

    if (this.options.target.hasPointerCapture(interaction.pointerId)) {
      this.options.target.releasePointerCapture(interaction.pointerId)
    }
    if (interaction.active) {
      this.options.target.removeAttribute('data-interacting')
      this.options.onDraggingChange(false)
    }
  }
}

/**
 * 取得指针事件在视口中的坐标。
 */
function pointOf(event: PointerEvent): DragPoint {
  return { x: event.clientX, y: event.clientY }
}

/**
 * 计算当前指针相对按下位置的直线距离，单位为 CSS px。
 */
function distance(origin: DragPoint, point: DragPoint): number {
  return Math.hypot(point.x - origin.x, point.y - origin.y)
}

/**
 * 将激活距离换算为沿当前移动方向的补偿，避免事件采样间隔改变起始位移。
 */
function activationCompensation(
  origin: DragPoint,
  point: DragPoint,
  activationDistance: number,
): DragPoint {
  const movement = {
    x: point.x - origin.x,
    y: point.y - origin.y,
  }
  const movementDistance = Math.hypot(movement.x, movement.y)
  if (movementDistance === 0 || activationDistance === 0) return { x: 0, y: 0 }

  const ratio = activationDistance / movementDistance
  return {
    x: movement.x * ratio,
    y: movement.y * ratio,
  }
}

/**
 * 判断按下是否来自来源元素内部的独立交互控件。
 */
function isInteractiveDescendant(
  event: PointerEvent,
  target: HTMLElement,
): boolean {
  for (const eventTarget of event.composedPath()) {
    if (eventTarget === target) return false
    if (
      eventTarget instanceof HTMLElement &&
      eventTarget.matches(interactiveSelector)
    )
      return true
  }
  return false
}

/**
 * 确认来源没有占用拖动需要的 individual translate，否则同步拒绝开始。
 */
function assertTargetTranslateAvailable(target: HTMLElement): void {
  const ownerWindow = target.ownerDocument.defaultView
  if (!ownerWindow) throw new Error('Draggable 来源元素必须属于浏览器窗口')

  if (ownerWindow.getComputedStyle(target).translate !== 'none') {
    throw new Error('Draggable 来源元素不能预先占用 CSS translate')
  }
}
