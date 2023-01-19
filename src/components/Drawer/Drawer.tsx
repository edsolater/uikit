import { MayDeepArray, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode, useEffect, useState } from 'react'
import { Div, DivProps } from '../../Div'
import { mergeProps } from '../../Div/utils/mergeProps'
import { useControllerRegister } from '../../hooks'
import { use2StateSyncer } from '../../hooks/use2StateSyncer'
import { ControllerRef } from '../../typings/tools'
import { Portal } from '../Portal'
import { Transition } from '../Transition/Transition'
import { createKit } from '../utils'
import { letDrawerStyle, LetDrawerStyleOptions } from './plugins/letDrawerStyle'

export type DrawerController = {
  isOpen: boolean
  open(): void
  close(): void
} & Required<Pick<DrawerProps, 'placement' | 'transitionSpeed'>>

export interface DrawerProps extends Omit<DivProps, 'children'>, LetDrawerStyleOptions {
  children?: MayFn<ReactNode, [utils: DrawerController]>
  open?: boolean
  placement?: 'from-left' | 'from-bottom' | 'from-top' | 'from-right'
  transitionSpeed?: 'fast' | 'normal'

  onOpen?: (utils: DrawerController) => void
  /** fired before close transform effect is end */
  onCloseImmediately?: (utils: DrawerController) => void
  onClose?(utils: DrawerController): void

  // -------- selfComponent --------
  controller?: MayDeepArray<ControllerRef<DrawerController>>
  componentId?: string

  // -------- sub --------
  anatomy?: {
    mask?: MayFn<DivProps, [utils: DrawerController]>
    panel?: MayFn<DivProps, [utils: DrawerController]>
  }
}

export const Drawer = createKit(
  { name: 'Drawer', plugin: [letDrawerStyle] },
  ({
    children,
    open = false,
    placement = 'from-left',
    transitionSpeed = 'normal',
    onOpen,
    onCloseImmediately,
    onClose,
    controller,
    componentId,
    anatomy,
    ...divProps
  }: DrawerProps) => {
    const transitionDuration = transitionSpeed === 'fast' ? 200 : 300

    // for onCloseTransitionEnd
    // during leave transition, open is still true, but innerOpen is false, so transaction will happen without props:open has change (if open is false, React may destory this component immediately)
    const [innerOpen, setInnerOpen] = useState(open)

    const innerController: DrawerController = {
      isOpen: innerOpen,
      open() {
        setInnerOpen(true)
      },
      close() {
        setInnerOpen(false)
      },
      placement,
      transitionSpeed
    }

    useEffect(() => {
      if (open) onOpen?.(innerController)
    }, [open])

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
          '& > *': {
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
          onBeforeLeave={() => onCloseImmediately?.(innerController)}
          onAfterLeave={() => onClose?.(innerController)}
          icss={{ transitionDelay: innerOpen ? `${transitionDuration}ms` : '', position: 'fixed', inset: 0 }}
        >
          <Div
            className='Drawer-mask'
            shadowProps={shrinkToValue(anatomy?.mask, [innerController])}
            onClick={innerController.close}
          />
        </Transition>

        <Transition
          className='Drawer-content'
          show={innerOpen}
          fromProps={{ icss: placementClasses[placement].translateFadeOut }}
          toProps={{}}
          cssTransitionDurationMs={transitionDuration}
        >
          <Div
            shadowProps={mergeProps(divProps, shrinkToValue(anatomy?.panel, [innerController]))}
            icss={{
              position: 'fixed',
              inset: 0
            }}
          >
            {shrinkToValue(children, [innerController])}
          </Div>
        </Transition>
      </Portal>
    )
  }
)

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
