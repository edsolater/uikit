import { ReactNode, RefObject, useImperativeHandle, useRef, useState } from 'react'

import { MayFn, shrinkToValue } from '@edsolater/fnkit'
import { useIsomorphicLayoutEffect }from '../../hooks'
import { AddProps } from '../AddProps'
import { Div } from '../../Div/Div'
import { Portal } from '../Portal'
import { SubComponent, SubComponentProps } from '../SubComponent'
import { Transition } from '../Transition/Transition'
import { PopupLocationInfo, usePopoverLocation } from './useLocationCalculator'
import { PopoverTiggerBy, PopoverTriggerControls, usePopoverTrigger } from './usePopoverTrigger'
import { DivChildNode } from '../../Div'

export * from './useLocationCalculator'
export * from './usePopoverTrigger'

export type PopoverPlacement =
  | 'left'
  | 'left-top'
  | 'left-bottom'
  | 'right'
  | 'right-top'
  | 'right-bottom'
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right'

export interface PopoverProps {
  triggerBy?: PopoverTiggerBy
  /** after delay time, `<Popover>` will be trigger */
  triggerDelay?: number
  closeDelay?: number

  /** for direct child */
  className?: string
  /** usually it's for debug, stay open */
  forceOpen?: boolean
  /** only affact init render */
  defaultOpen?: boolean
  canOpen?: boolean
  status?: Ref<any>
  placement?: PopoverPlacement
  /** for corner placement like 'top-left' 'top-right etc. */
  cornerOffset?: number
  /** gap between `<PopoverButton>` and `<PopoverPanel>`*/
  popoverGap?: number
  /** to leave some space when touch the viewport boundary */
  viewportBoundaryInset?: number

  renderButton?: MayFn<DivChildNode>
  children?: PopoverProps['renderButton']
  renderPanel?: MayFn<
    DivChildNode,
    [
      payload: {
        locationInfo?: PopupLocationInfo
        close(): void
        buttonRef?: RefObject<HTMLDivElement>
        selfRef?: RefObject<HTMLDivElement>
        placement?: PopoverPlacement
      }
    ]
  >
}

const POPOVER_STACK_ID = 'popover-stack'

const popupTransformOrigins = {
  top: 'bottom',
  'top-left': 'bottom left',
  'top-right': 'bottom right',
  right: 'left',
  'right-top': 'top left',
  'right-bottom': 'bottom left',
  left: 'right',
  'left-top': 'top right',
  'left-bottom': 'bottom right',
  bottom: 'top',
  'bottom-left': 'top left',
  'bottom-right': 'top right'
}

export type PopoverHandles = {
  isPanelShowed: boolean
} & PopoverTriggerControls

export function Popover({
  className,
  children,
  forceOpen,
  placement = 'top',
  triggerBy,
  triggerDelay,
  closeDelay,
  canOpen = true,
  defaultOpen,
  controller,
  cornerOffset,
  popoverGap,
  viewportBoundaryInset,

  renderButton,
  renderPanel
}: PopoverProps) {
  const [isPanelMounted, setIsPanelMounted] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const { isTriggled, controls } = usePopoverTrigger(buttonRef, panelRef, {
    disabled: !canOpen,
    defaultOpen,
    triggerDelay,
    closeDelay,
    triggerBy
  })

  const { locationInfo, updateLocation } = usePopoverLocation(buttonRef, panelRef, {
    placement,
    cornerOffset,
    popoverGap,
    viewportBoundaryInset
  })

  useImperativeHandle<any, PopoverHandles>(controller, () => ({ ...controls, isPanelShowed: isTriggled }))

  useIsomorphicLayoutEffect(() => {
    if (isPanelMounted) {
      updateLocation()
    }
  }, [isTriggled, isPanelMounted])

  return (
    <>
      <AddProps domRef={buttonRef}>
        <AddProps>{shrinkToValue(renderButton)}</AddProps>
      </AddProps>
      <Portal
        id={POPOVER_STACK_ID}
        zIndex={1030}
        icss={{
          '*': {
            pointerEvents: 'initial'
          }
        }}
      >
        <Div class={[Popover.name, className]}>
          <Transition
            show={forceOpen || isTriggled}
            fromProps={{ icss: { opacity: 0, transform: 'scale(0.5)' } }}
            toProps={{ icss: { opacity: 1, transform: 'scale(1)' } }}
            cssTransitionDurationMs={150}
            onBeforeEnter={() => {
              setIsPanelMounted(true)
            }}
            onAfterLeave={() => {
              setIsPanelMounted(false)
            }}
          >
            <Div
              icss={{ position: 'absolute', zIndex: 1030, transformOrigin: popupTransformOrigins[placement] }}
              style={
                locationInfo ? { left: locationInfo.panelLeft, top: locationInfo.panelTop } : { visibility: 'hidden' }
              }
              domRef={panelRef}
            >
              <PopoverPanel>
                {shrinkToValue(renderPanel ?? children, [
                  { close: controls.off, locationInfo, placement, buttonRef, selfRef: panelRef }
                ])}
              </PopoverPanel>
            </Div>
          </Transition>
        </Div>
      </Portal>
    </>
  )
}

export type PopoverButtonProps = {} & SubComponentProps

export function PopoverButton(props: PopoverButtonProps) {
  return <SubComponent {...props} class={[PopoverButton.name, props.class]} />
}

export type PopoverPanelProps = {
  children?: MayFn<
    DivChildNode,
    [
      payload: {
        locationInfo?: PopupLocationInfo
        close(): void
        buttonRef?: RefObject<HTMLDivElement>
        selfRef?: RefObject<HTMLDivElement>
        placement?: PopoverPlacement
      }
    ]
  >
} & Omit<SubComponentProps, 'children'>

export function PopoverPanel({ children, ...subcomponentProps }: PopoverPanelProps) {
  return <SubComponent {...subcomponentProps}>{children as ReactNode /* fake */}</SubComponent>
}
