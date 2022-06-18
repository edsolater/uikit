import { MayArray } from '@edsolater/fnkit'
import { useClick, useClickOutside, useHover, useToggleRef } from '@edsolater/hookit'
import { RefObject, useState } from 'react'

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
    disabled?: boolean
    triggerDelay?: number
    closeDelay?: number
    /** @default click */
    triggerBy?: PopoverTiggerBy
  }
): { isPanelShowed: boolean; controls: { off(): void; on(): void; toggle(): void } } {
  const { closeDelay = 600, triggerBy = 'click', triggerDelay, disabled } = options ?? {}

  // TODO: useToggleRef should be toggleWrapper(useSignalState())
  const [isPanelShowed, setisPanelShowed] = useState(false)
  const [isPanelShowedRef, { toggle, on, delayOff, off }] = useToggleRef(false, {
    delay: closeDelay,
    onChange: (isOn) => {
      setisPanelShowed(isOn)
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
    onHoverStart: on,
    onHoverEnd: () => delayOff()
  })
  useHover(panelRef, {
    disable: disabled || !triggerBy.includes('hover'),
    onHoverStart: on,
    onHoverEnd: () => delayOff()
  })
  // // TODO: popover content may not focusable, so can't set onBlur
  // NOTE: foce can confilt with useClickOutside
  // useFocus([buttonRef, panelRef], {
  //   disable: disabled || !triggerBy.includes('focus'),
  //   onFocus: on
  //   // onBlur: delayOff
  // })

  useClickOutside(panelRef, {
    disable: disabled || !isPanelShowed,
    onClickOutSide: off
  })
  return { isPanelShowed, controls: { off, on, toggle } }
}
