import { MayArray } from '@edsolater/fnkit'
import { RefObject, useState } from 'react'
import { useClick, useClickOutside, useHover, useToggleRef } from '../../hooks'

export type PopoverTriggerControls = {
  on(): void
  off(): void
  toggle(): void
}

export type PopoverTiggerBy = MayArray<'hover' | 'click' | 'focus'>

export function usePopoverTrigger(
  buttonRef: RefObject<HTMLElement | undefined | null>,
  panelRef: RefObject<HTMLElement | undefined | null>,
  options?: {
    defaultOpen?: boolean
    disabled?: boolean
    triggerDelay?: number
    closeDelay?: number
    /** @default click */
    triggerBy?: PopoverTiggerBy
  }
): { isTriggled: boolean; controls: { off(): void; on(): void; toggle(): void } } {
  const { closeDelay = 600, triggerBy = 'click', triggerDelay, disabled } = options ?? {}

  // TODO: useToggleRef should be toggleWrapper(useSignalState())
  const [isTriggled, setIsTriggled] = useState(Boolean(options?.defaultOpen))
  const [isPanelShowedRef, { toggle, on, delayOff, off }] = useToggleRef(Boolean(options?.defaultOpen), {
    delay: closeDelay,
    onChange: (isOn) => {
      setIsTriggled(isOn)
    }
  })

  useClick(buttonRef, {
    disable: Boolean(disabled || !triggerBy.includes('click') || isPanelShowedRef.current),
    onClick: () => {
      if (isPanelShowedRef.current === false) {
        on()
      }
    }
  })

  useHover(buttonRef, {
    disable: disabled || !triggerBy.includes('hover'),
    triggerDelay,
    onHoverEnter: on,
    onHoverLeave: delayOff
  })
  useHover(panelRef, {
    disable: disabled || !triggerBy.includes('hover'),
    onHoverEnter: on,
    onHoverLeave: delayOff
  })
  // // TODO: popover content may not focusable, so can't set onBlur
  // NOTE: foce can confilt with useClickOutside
  // useFocus([buttonRef, panelRef], {
  //   disable: disabled || !triggerBy.includes('focus'),
  //   onFocus: on
  //   // onBlur: delayOff
  // })

  useClickOutside(panelRef, {
    disable: disabled || !isTriggled,
    onClickOutSide: off
  })
  return { isTriggled, controls: { off, on, toggle } }
}
