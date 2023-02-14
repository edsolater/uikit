import { MayDeepArray, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode, useEffect, useState } from 'react'
import { Div, DivProps } from '../../Div'
import { mergeProps } from '../../Div/utils/mergeProps'
import { useStatusRef } from '../../hooks'
import { use2StateSyncer } from '../../hooks/use2StateSyncer'
import { Plugin } from '../../plugins/type'
import { ExtendsProps, StatusRef } from '../../typings/tools'
import { Portal } from '../Portal'
import { Transition } from '../Transition/Transition'
import { useKitProps } from '../utils'
import { letDrawerStyle, LetDrawerStyleOptions } from './plugins/letDrawerStyle'

export type DrawerStatus = {
  isOpen: boolean
  open(): void
  close(): void
} & Required<Pick<DrawerProps, 'placement' | 'transitionSpeed'>>

export type DrawerProps = ExtendsProps<{
  children?: MayFn<ReactNode, [utils: DrawerStatus]>
  open?: boolean
  placement?: 'from-left' | 'from-bottom' | 'from-top' | 'from-right'
  transitionSpeed?: 'fast' | 'normal'

  onOpen?: (utils: DrawerStatus) => void
  /** fired before close transform effect is end */
  onCloseImmediately?: (utils: DrawerStatus) => void
  onClose?(utils: DrawerStatus): void

  // -------- common --------
  shadowProps?: MayDeepArray<Partial<DrawerProps>>
  plugin?: MayDeepArray<Plugin<DivProps>>

  // -------- selfComponent --------
  statusRef?: MayDeepArray<StatusRef<DrawerStatus>>
  componentId?: string

  // -------- sub --------
  anatomy?: {
    mask?: MayFn<DivProps, [utils: DrawerStatus]>
    panel?: MayFn<DivProps, [utils: DrawerStatus]>
  }
} , DivProps , LetDrawerStyleOptions>

export const Drawer = (inputProps: DrawerProps) => {
  const [props, divProps] = useKitProps(inputProps, {
    plugin: letDrawerStyle,
    defaultProps: {
      placement: 'from-left',
      transitionSpeed: 'normal'
    } satisfies DrawerProps
  })

  const transitionDuration = props.transitionSpeed === 'fast' ? 200 : 300

  // for onCloseTransitionEnd
  // during leave transition, open is still true, but innerOpen is false, so transaction will happen without props:open has change (if open is false, React may destory this component immediately)
  const [innerOpen, setInnerOpen] = useState(Boolean(props.open))

  const drawerStatus: DrawerStatus = {
    isOpen: innerOpen,
    open() {
      setInnerOpen(true)
    },
    close() {
      setInnerOpen(false)
    },
    placement: props.placement,
    transitionSpeed: props.transitionSpeed
  }

  useEffect(() => {
    if (props.open) props.onOpen?.(drawerStatus)
  }, [props.open])

  if (props.statusRef) useStatusRef(props.componentId, props.statusRef, drawerStatus)

  use2StateSyncer({
    state1: props.open,
    state2: innerOpen,
    onState1Changed: (open) => {
      open ? drawerStatus.open() : drawerStatus.close()
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
        onBeforeLeave={() => props.onCloseImmediately?.(drawerStatus)}
        onAfterLeave={() =>props. onClose?.(drawerStatus)}
        icss={{ transitionDelay: innerOpen ? `${transitionDuration}ms` : '', position: 'fixed', inset: 0 }}
      >
        <Div
          className='Drawer-mask'
          shadowProps={shrinkToValue(props.anatomy?.mask, [drawerStatus])}
          onClick={drawerStatus.close}
        />
      </Transition>

      <Transition
        className='Drawer-content'
        show={innerOpen}
        fromProps={{ icss: placementClasses[props.placement].translateFadeOut }}
        toProps={{}}
        cssTransitionDurationMs={transitionDuration}
      >
        <Div
          shadowProps={mergeProps(divProps, shrinkToValue(props.anatomy?.panel, [drawerStatus]))}
          icss={{
            position: 'fixed',
            inset: 0
          }}
        >
          {shrinkToValue(props.children, [drawerStatus])}
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
