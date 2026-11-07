/**
 * 页面内拖放的共享会话协议。
 *
 * 【职责边界】登记 Droppable、沿 composed tree 命中指针下的目标，并比较组标识。
 */
import { toPromiseResultProxy, type PromiseResultProxy } from '@edsolater/fnkit'

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
 * 目标元素就绪后登记，返回可等待的注销操作。
 * 回调中的 this.target 为已解析的真实元素。
 */
export function registerInternalDropTarget(
  options: Omit<InternalDropTarget, 'target'> & {
    target: HTMLElement | PromiseLike<HTMLElement>
  } & ThisType<InternalDropTarget>,
): PromiseResultProxy<() => void> {
  return toPromiseResultProxy(
    Promise.resolve(options.target).then((target) => {
      const resolvedTarget = { ...options, target }
      dropTargets.set(target, resolvedTarget)
      return () => {
        if (dropTargets.get(target) === resolvedTarget) dropTargets.delete(target)
      }
    }),
  )
}

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

function getComposedParent(element: Element): Element | null {
  if (element.assignedSlot) return element.assignedSlot
  if (element.parentElement) return element.parentElement

  const root = element.getRootNode()
  return root instanceof ShadowRoot ? root.host : null
}
