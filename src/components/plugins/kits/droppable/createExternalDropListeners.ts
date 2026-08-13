/**
 * Droppable 的系统外部材料入口。
 *
 * 原生 Drag and Drop 只负责接收浏览器外部的 DataTransfer；这里把它归一为
 * DropContext，并与页面内拖动共享接收判断和悬停状态。
 */
import type { EventListeners } from '../../../Piv/on/handleOn'
import { isWithinDropScope } from '../dragAndDrop'
import {
  createExternalDropContext,
  type DropContext,
  type ExternalDropContext,
} from './dropContext'

export interface ExternalDropOptions {
  element: HTMLElement
  dropEffect: DataTransfer['dropEffect'] | undefined
  enabled(): boolean
  accepts(context: DropContext): boolean
  onDrop(context: DropContext): void
  showHover(acceptable: boolean): void
  resetHover(): void
}

export function createExternalDropListeners(options: ExternalDropOptions): EventListeners {
  // 原生 dragenter/dragleave 会在子元素间移动时反复触发；计数归零才真正离开目标。
  let enteredChildren = 0

  const acceptsExternalDrop = (context: ExternalDropContext): boolean => (
    isWithinDropScope(undefined, options.element) && options.accepts(context)
  )

  return {
    dragenter: ({ event }) => {
      if (!options.enabled()) return
      enteredChildren += 1
      const context = createExternalDropContext(event, options.element)
      options.showHover(context ? acceptsExternalDrop(context) : false)
    },
    dragover: {
      passive: false,
      callback: ({ event, preventDefault }) => {
        const context = createExternalDropContext(event, options.element)
        if (!context || !acceptsExternalDrop(context)) {
          options.showHover(false)
          return
        }

        options.showHover(true)
        preventDefault()
        if (options.dropEffect) context.dataTransfer.dropEffect = options.dropEffect
      },
    },
    dragleave: () => {
      enteredChildren = Math.max(0, enteredChildren - 1)
      if (enteredChildren === 0) options.resetHover()
    },
    drop: {
      passive: false,
      callback: ({ event, preventDefault }) => {
        const context = createExternalDropContext(event, options.element)
        const accepted = context ? acceptsExternalDrop(context) : false
        enteredChildren = 0
        options.resetHover()
        if (!context || !accepted) return

        preventDefault()
        event.stopPropagation()
        options.onDrop(context)
      },
    },
  }
}
