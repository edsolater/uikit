/**
 * 这个文件负责 Popover 的本地控制能力。
 * Controller 承载可对外公开的身份、可观察状态与业务操作；controllerBindings 负责内部对象的接入和连接生命周期。
 */
import { stateView, val, type StateView } from '@/foundation'
import { createToggle } from '@/hooks'
import type { RefReceiver } from '@/hooks/createRef'

export type PopoverToggleState = 'open' | 'closed'

export type PopoverToggleEvent = Event & {
  newState?: PopoverToggleState
  oldState?: PopoverToggleState
}

type CreatePopoverControllerOptions = {
  onToggle?: (open: boolean, event: PopoverToggleEvent) => void
  onBeforeToggle?: (open: boolean, event: PopoverToggleEvent) => void
}

/** 身份可用于外部关联，即使组件内部也使用它，仍属于 Controller。 */
export type PopoverController = {
  popoverId: string
  triggerId: string
  isOpen: StateView<boolean>
  showPopover: () => void
  hidePopover: (restoreFocus?: boolean) => void
  togglePopover: (force?: boolean) => void
}

/** 组件定义端将内部触发器和浮层接入 Controller，建立连接并在退出时释放。 */
export type PopoverControllerBindings = {
  popoverDomRef: RefReceiver<HTMLDivElement>
  triggerDomRef: RefReceiver<HTMLButtonElement>
}

let popoverSequence = 0

function createPopoverIdentity() {
  popoverSequence += 1

  return {
    popoverId: `popover-${popoverSequence}`,
    triggerId: `popover-trigger-${popoverSequence}`,
  }
}

function readPopoverOpenState(element?: HTMLDivElement) {
  return element?.matches(':popover-open') ?? false
}

/**
 * 创建包含身份、状态与操作的 Controller，以及内部对象的接入能力 controllerBindings。
 * isOpen 提供只读视图，状态修改由浮层操作及原生 toggle 事件负责。
 * @example
 * const [controller, controllerBindings] = createPopoverController()
 * // 组件定义端：<Piv id={controller.popoverId} domRef={controllerBindings.popoverDomRef} htmlProps={{ popover: 'auto' }} />
 * // 事件中调用：controller.showPopover()
 */
export function createPopoverController(
  options: CreatePopoverControllerOptions = {},
): [
  controller: PopoverController,
  controllerBindings: PopoverControllerBindings,
] {
  const { popoverId, triggerId } = createPopoverIdentity()
  const [isOpen, isOpenControl] = createToggle(false)
  let popoverElement: HTMLDivElement | undefined
  let triggerElement: HTMLButtonElement | undefined

  function triggerDomRef(element: HTMLButtonElement) {
    triggerElement = element
    return () => {
      triggerElement = undefined
    }
  }

  function syncOpenState(nextOpen: boolean) {
    if (nextOpen) {
      isOpenControl.turnOn()
      return
    }

    isOpenControl.turnOff()
  }

  function popoverDomRef(element: HTMLDivElement) {
    popoverElement = element
    const handleToggle = (event: Event) => {
      const toggleEvent = event as PopoverToggleEvent
      const nextOpen = toggleEvent.newState
        ? toggleEvent.newState === 'open'
        : readPopoverOpenState(element)

      syncOpenState(nextOpen)
      options.onToggle?.(nextOpen, toggleEvent)
    }

    const handleBeforeToggle = (event: Event) => {
      const toggleEvent = event as PopoverToggleEvent
      const nextOpen = toggleEvent.newState === 'open'

      options.onBeforeToggle?.(nextOpen, toggleEvent)
    }

    element.addEventListener('toggle', handleToggle)
    element.addEventListener('beforetoggle', handleBeforeToggle)

    return () => {
      element.removeEventListener('toggle', handleToggle)
      element.removeEventListener('beforetoggle', handleBeforeToggle)
      popoverElement = undefined
    }
  }

  function showPopover() {
    if (!popoverElement) return
    popoverElement.showPopover?.()
    isOpenControl.turnOn()
  }

  /** 关闭浮层；悬停说明关闭时可保留当前焦点。 */
  function hidePopover(restoreFocus = true) {
    if (!popoverElement) return
    popoverElement.hidePopover?.()
    isOpenControl.turnOff()
    if (restoreFocus) triggerElement?.focus()
  }

  function togglePopover(force?: boolean) {
    if (force === true) {
      showPopover()
      return
    }

    if (force === false) {
      hidePopover()
      return
    }

    if (!popoverElement) return
    popoverElement.togglePopover?.()
    syncOpenState(readPopoverOpenState(popoverElement))
  }

  return [
    {
      popoverId,
      triggerId,
      isOpen: stateView(() => val(isOpen)),
      showPopover,
      hidePopover,
      togglePopover,
    },
    { popoverDomRef, triggerDomRef },
  ]
}
