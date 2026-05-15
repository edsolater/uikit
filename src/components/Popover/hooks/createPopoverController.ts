/**
 * 这个文件负责 Popover 的本地控制能力。
 * 它只管理 popover 元素引用、打开状态镜像和原生 toggle 生命周期，不负责组件结构或视觉样式。
 */
import { createEffect, onCleanup } from 'solid-js'
import { type State, $, createDomRef, createToggle } from '../../../hooks'

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
  isOpen: State<boolean>
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

export function createPopoverController(options: CreatePopoverControllerOptions = {}): PopoverController {
  const { popoverId, triggerId } = createPopoverIdentity()
  const [isOpen, isOpenControl] = createToggle(false)
  const [popoverElement, setPopoverElement] = createDomRef<HTMLDivElement>()
  const [triggerElement, setTriggerElement] = createDomRef<HTMLButtonElement>()

  function syncOpenState(nextOpen: boolean) {
    if (nextOpen) {
      isOpenControl.turnOn()
      return
    }

    isOpenControl.turnOff()
  }

  createEffect(() => {
    const element = $(popoverElement)

    if (!element) {
      return
    }

    syncOpenState(readPopoverOpenState(element))

    const handleToggle = (event: Event) => {
      const toggleEvent = event as PopoverToggleEvent
      const nextOpen = toggleEvent.newState ? toggleEvent.newState === 'open' : readPopoverOpenState(element)

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

    onCleanup(() => {
      element.removeEventListener('toggle', handleToggle)
      element.removeEventListener('beforetoggle', handleBeforeToggle)
    })
  })

  function showPopover() {
    const element = $(popoverElement)

    if (!element) {
      return
    }

    element.showPopover?.()
    isOpenControl.turnOn()
  }

  function hidePopover() {
    const element = $(popoverElement)

    if (!element) {
      return
    }

    element.hidePopover?.()
    isOpenControl.turnOff()
    $(triggerElement)?.focus()
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

    const element = $(popoverElement)

    if (!element) {
      return
    }

    element.togglePopover?.()
    syncOpenState(readPopoverOpenState(element))
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
