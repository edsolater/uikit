/**
 * Droppable 的统一输入材料。
 *
 * 页面内 Pointer 拖动提供 payload 与来源元素；系统外部拖放提供 DataTransfer、文件和
 * 原生 DragEvent。kind 让接收端先辨别来源，再读取该来源成立的材料。
 */
import type { InternalDrag } from '../dragAndDrop'

interface DropContextBase {
  files: File[]
  items: DataTransferItem[]
  types: string[]
  target: HTMLElement
}

/** 页面内 Pointer 拖动；不伪造浏览器 DataTransfer。 */
export interface InternalDropContext extends DropContextBase {
  kind: 'internal'
  payload: unknown
  source: HTMLElement
  dataTransfer: undefined
  event: PointerEvent
}

/** 来自浏览器窗口外部的原生拖放；不存在 UIKit payload 或来源元素。 */
export interface ExternalDropContext extends DropContextBase {
  kind: 'external'
  payload: undefined
  source: undefined
  dataTransfer: DataTransfer
  event: DragEvent
}

export type DropContext = InternalDropContext | ExternalDropContext

export function createInternalDropContext(
  drag: InternalDrag,
  event: PointerEvent,
  target: HTMLElement,
): InternalDropContext {
  return {
    kind: 'internal',
    payload: drag.payload,
    files: [],
    items: [],
    types: [],
    source: drag.source,
    target,
    dataTransfer: undefined,
    event,
  }
}

export function createExternalDropContext(
  event: DragEvent,
  target: HTMLElement,
): ExternalDropContext | undefined {
  const dataTransfer = event.dataTransfer
  if (!dataTransfer) return undefined

  return {
    kind: 'external',
    payload: undefined,
    files: Array.from(dataTransfer.files),
    items: Array.from(dataTransfer.items),
    types: Array.from(dataTransfer.types),
    source: undefined,
    target,
    dataTransfer,
    event,
  }
}
