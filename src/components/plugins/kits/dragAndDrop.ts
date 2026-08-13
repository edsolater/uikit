/**
 * 页面内拖放的共享会话协议。
 *
 * 【职责边界】登记 Droppable、沿 composed tree 命中指针下的目标，并用 Scope
 * 判断拖放双方是否处在同一范围；自身不是 Plugin。
 */
import { createScopeCapability, findScopeBoundary } from './scope'

export const dragAndDrop = createScopeCapability('drag-and-drop')

export interface DragPoint {
  x: number
  y: number
}

export interface InternalDrag {
  payload: unknown
  source: HTMLElement
  /** 激活拖动时取得的 Scope 快照；移动来源元素不会改变本次拖动的范围。 */
  scope: object | undefined
}

export interface InternalDropTarget {
  element: HTMLElement
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

export function createInternalDrag(source: HTMLElement, payload: unknown): InternalDrag {
  return {
    payload,
    source,
    scope: findScopeBoundary(source, dragAndDrop),
  }
}

export function registerInternalDropTarget(target: InternalDropTarget): () => void {
  dropTargets.set(target.element, target)

  return () => {
    if (dropTargets.get(target.element) === target) dropTargets.delete(target.element)
  }
}

export function findInternalDropTarget(
  drag: InternalDrag,
  event: PointerEvent,
): InternalDropMatch | undefined {
  const visited = new Set<HTMLElement>()

  for (const hitElement of document.elementsFromPoint(event.clientX, event.clientY)) {
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
        acceptable: isWithinDropScope(drag.scope, target.element) && target.accepts(drag, event),
      }
    }
  }

  return undefined
}

export function isWithinDropScope(
  sourceScope: object | undefined,
  target: HTMLElement,
): boolean {
  return sourceScope === findScopeBoundary(target, dragAndDrop)
}

function getComposedParent(element: Element): Element | null {
  if (element.assignedSlot) return element.assignedSlot
  if (element.parentElement) return element.parentElement

  const root = element.getRootNode()
  return root instanceof ShadowRoot ? root.host : null
}
