/**
 * 这个文件负责 Popover 的本地控制能力。
 * 它只管理 popover 元素引用、打开状态镜像和原生 toggle 生命周期，不负责组件结构或视觉样式。
 */
import { createEffect, createSignal, onCleanup, type Accessor } from 'solid-js'

export type PopoverToggleState = 'open' | 'closed'

export type PopoverToggleEvent = Event & {
  newState?: PopoverToggleState
  oldState?: PopoverToggleState
}

type CreatePopoverControllerOptions = {
  onToggle?: (open: boolean, event: PopoverToggleEvent) => void
  onBeforeToggle?: (open: boolean, event: PopoverToggleEvent) => void
}

export type PopoverController = {
  popoverId: string
  triggerId: string
  isOpen: Accessor<boolean>
  setPopoverElement: (element: HTMLDivElement) => void
  setTriggerElement: (element: HTMLButtonElement) => void
  showPopover: () => void
  hidePopover: () => void
  togglePopover: (force?: boolean) => void
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

export function createPopoverController(
  options: CreatePopoverControllerOptions = {},
): PopoverController {
  const { popoverId, triggerId } = createPopoverIdentity()
  const [isOpen, setIsOpen] = createSignal(false)
  const [popoverElement, setPopoverElement] = createSignal<HTMLDivElement>()
  const [triggerElement, setTriggerElement] = createSignal<HTMLButtonElement>()

  createEffect(() => {
    const element = popoverElement()

    if (!element) {
      return
    }

    setIsOpen(readPopoverOpenState(element))

    const handleToggle = (event: Event) => {
      const toggleEvent = event as PopoverToggleEvent
      const nextOpen = toggleEvent.newState
        ? toggleEvent.newState === 'open'
        : readPopoverOpenState(element)

      setIsOpen(nextOpen)
      options.onToggle?.(nextOpen, toggleEvent)
    }

    const handleBeforeToggle = (event: Event) => {
      const toggleEvent = event as PopoverToggleEvent
      const nextOpen = toggleEvent.newState === 'open'

      options.onBeforeToggle?.(nextOpen, toggleEvent)
    }

    element.addEventListener('toggle', handleToggle)
    element.addEventListener('beforetoggle', handleBeforeToggle)

    onCleanup(() => {
      element.removeEventListener('toggle', handleToggle)
      element.removeEventListener('beforetoggle', handleBeforeToggle)
    })
  })

  function showPopover() {
    const element = popoverElement()

    if (!element) {
      return
    }

    element.showPopover?.()
    setIsOpen(true)
  }

  function hidePopover() {
    const element = popoverElement()

    if (!element) {
      return
    }

    element.hidePopover?.()
    setIsOpen(false)
    triggerElement()?.focus()
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

    const element = popoverElement()

    if (!element) {
      return
    }

    element.togglePopover?.()
    setIsOpen(readPopoverOpenState(element))
  }

  return {
    popoverId,
    triggerId,
    isOpen,
    setPopoverElement,
    setTriggerElement,
    showPopover,
    hidePopover,
    togglePopover,
  }
}