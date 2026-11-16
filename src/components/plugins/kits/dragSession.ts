/**
 * 页面内拖放的共享会话协议。
 *
 * 登记真实接收目标，沿 composed tree 命中指针下的元素并比较组标识。
 *
 * 同步登记与注销让当前指针事务取得已经接入且仍存活的目标。
 */

export interface DragPoint {
  x: number
  y: number
}

export interface InternalDrag {
  payload: unknown
  source: HTMLElement
  /** 激活拖动时确定的组标识。 */
  id?: object
}

export interface InternalDropTarget {
  target: HTMLElement
  id?: object
  enabled(): boolean
  accepts(drag: InternalDrag, event: PointerEvent): boolean
  hover(acceptable: boolean): void
  leave(): void
  drop(drag: InternalDrag, event: PointerEvent): void
}

export interface InternalDropMatch {
  target: InternalDropTarget
  acceptable: boolean
}

const dropTargets = new WeakMap<HTMLElement, InternalDropTarget>()

/**
 * 以原始来源、材料和组合身份创建本次页面内拖动描述。
 */
export function createInternalDrag(
  source: HTMLElement,
  payload: unknown,
  id?: object,
): InternalDrag {
  return {
    payload,
    source,
    id,
  }
}

/**
 * 登记已接入的目标元素，返回本次登记的同步注销入口。
 * 指针命中与回调始终使用同一个真实元素，注销后立即停止接收。
 */
export function registerInternalDropTarget(
  options: InternalDropTarget,
): () => void {
  dropTargets.set(options.target, options)
  return () => {
    if (dropTargets.get(options.target) === options)
      dropTargets.delete(options.target)
  }
}

/**
 * 找到指针下首个启用的接收目标，并按组合身份与接收规则判断是否可放下。
 */
export function findInternalDropTarget(
  drag: InternalDrag,
  event: PointerEvent,
): InternalDropMatch | undefined {
  const visited = new Set<HTMLElement>()

  for (const hitElement of drag.source.ownerDocument.elementsFromPoint(
    event.clientX,
    event.clientY,
  )) {
    if (isWithinSource(hitElement, drag.source)) continue

    for (
      let element: Element | null = hitElement;
      element;
      element = getComposedParent(element)
    ) {
      if (!(element instanceof HTMLElement) || visited.has(element)) continue
      visited.add(element)

      const target = dropTargets.get(element)
      if (!target?.enabled()) continue

      return {
        target,
        acceptable: drag.id === target.id && target.accepts(drag, event),
      }
    }
  }

  return undefined
}

/**
 * 判断命中元素是否位于拖动来源自身的 composed tree 中。
 */
function isWithinSource(element: Element, source: HTMLElement): boolean {
  for (
    let current: Element | null = element;
    current;
    current = getComposedParent(current)
  ) {
    if (current === source) return true
  }
  return false
}

/**
 * 沿插槽、普通父元素与 ShadowRoot 宿主取得可见组合关系中的父元素。
 */
function getComposedParent(element: Element): Element | null {
  if (element.assignedSlot) return element.assignedSlot
  if (element.parentElement) return element.parentElement

  const root = element.getRootNode()
  return root instanceof ShadowRoot ? root.host : null
}
