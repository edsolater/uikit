import { MayDeepArray, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode, useEffect, useState } from 'react'
import { Div, DivProps } from '../../Div'
import { mergeProps } from '../../Div/utils/mergeProps'
import { useControllerRegister } from '../../hooks'
import { use2StateSyncer } from '../../hooks/use2StateSyncer'
import { ControllerRef } from '../../typings/tools'
import { Portal } from '../Portal'
import { Transition } from '../Transition/Transition'

export type DrawerController = {
  isOpen: boolean
  open(): void
  close(): void
}

export interface DrawerProps extends Omit<DivProps, 'children'> {
  children?: MayFn<ReactNode, [utils: DrawerController]>
  open: boolean
  placement?: 'from-left' | 'from-bottom' | 'from-top' | 'from-right'
  transitionSpeed?: 'fast' | 'normal'
  // if content is scrollable, PLEASE open it!!!, for blur will make scroll super fuzzy
  maskNoBlur?: boolean
  canClosedByMask?: boolean
  onOpen?: () => void
  /** fired before close transform effect is end */
  onCloseImmediately?: () => void
  onClose?(): void

  // -------- selfComponent --------
  controller?: MayDeepArray<ControllerRef<DrawerController>>
  componentId?: string

  // -------- sub --------
  anatomy?: {
    panel?: MayFn<DivProps, [utils: DrawerController]>
  }
}

export function Drawer({
  children,
  open,
  placement = 'from-left',
  transitionSpeed = 'normal',
  maskNoBlur,
  canClosedByMask = true,
  onOpen,
  onCloseImmediately,
  onClose,
  controller,
  componentId,
  anatomy,
  ...divProps
}: DrawerProps) {
  const transitionDuration = transitionSpeed === 'fast' ? 200 : 300

  // for onCloseTransitionEnd
  // during leave transition, open is still true, but innerOpen is false, so transaction will happen without props:open has change (if open is false, React may destory this component immediately)
  const [innerOpen, setInnerOpen] = useState(open)

  useEffect(() => {
    if (open) onOpen?.()
  }, [open])

  const innerController: DrawerController = {
    isOpen: innerOpen,
    open() {
      setInnerOpen(true)
    },
    close() {
      setInnerOpen(false)
    }
  }

  if (controller) useControllerRegister(componentId, controller, innerController)

  use2StateSyncer({
    state1: open,
    state2: innerOpen,
    onState1Changed: (open) => {
      open ? innerController.open() : innerController.close()
    }
  })

  return (
    <Portal
      id={DRAWER_STACK_ID}
      zIndex={1010}
      icss={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        '*': {
          pointerEvents: 'initial'
        }
      }}
      onClick={({ ev }) => ev.stopPropagation()}
    >
      <Transition
        show={innerOpen}
        fromProps={{ icss: { opacity: 0 } }}
        toProps={{ icss: { opacity: 1 } }}
        cssTransitionDurationMs={75}
        onBeforeLeave={onCloseImmediately}
        onAfterLeave={onClose}
        icss={{ transitionDelay: innerOpen ? `${transitionDuration}ms` : '', position: 'fixed', inset: 0 }}
      >
        <Div
          className={'Drawer-mask'}
          icss={{
            background: '#0000001c',
            backdropFilter: maskNoBlur ? undefined : 'blur(10px)',
            pointerEvents: canClosedByMask ? undefined : 'none'
          }}
          onClick={innerController.close}
        />
      </Transition>

      <Transition
        className={'Drawer-content'}
        show={innerOpen}
        fromProps={{ icss: placementClasses[placement].translateFadeOut }}
        toProps={{}}
        cssTransitionDurationMs={transitionDuration}
      >
        <Div
          shadowProps={mergeProps(divProps, shrinkToValue(anatomy?.panel, [innerController]))}
          icss={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            '*': { pointerEvents: 'initial' }
          }}
        >
          {shrinkToValue(children, [innerController])}
        </Div>
      </Transition>
    </Portal>
  )
}

export const DRAWER_STACK_ID = 'drawer-stack'

const placementClasses = {
  'from-left': {
    absolutePostion: { left: 0, top: 0, bottom: 0 },
    translateFadeOut: { transform: 'translateX(-100%)' }
  },
  'from-bottom': {
    absolutePostion: { left: 0, right: 0, bottom: 0 },
    translateFadeOut: { transform: 'translateY(100%)' }
  },
  'from-right': {
    absolutePostion: { right: 0, top: 0, bottom: 0 },
    translateFadeOut: { transform: 'translateX(100%)' }
  },
  'from-top': {
    absolutePostion: { left: 0, right: 0, top: 0 },
    translateFadeOut: { transform: 'translateY(-100%)' }
  }
}
