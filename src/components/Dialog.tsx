import { MayFn, shrinkToValue } from '@edsolater/fnkit'
import { useKeyboardShortcurt, useRecordedEffect, useToggle } from '@edsolater/hookit'
import { ReactNode, RefObject, useImperativeHandle, useRef } from 'react'
import { DivProps } from '../../dist'
import { useTwoStateSyncer } from '../hooks/use2StateSyncer.temp'
import { useComponentHandler, useComponentHandlerRegister } from '../hooks/useComponentHandler'
import { Div } from './Div'
import { Portal } from './Portal'
import { Transition } from './Transition'

const DIALOG_STACK_ID = 'dialog-stack'

export interface DialogProps extends Omit<DivProps, 'children'> {
  componentRef?: RefObject<any>
  /** can access dialog's handler by useComponentHandler(dialogId) */
  componentId?: string | number

  open: boolean
  /** this is the className of modal card */
  children?: MayFn<ReactNode, [{ close: () => void }]>
  transitionSpeed?: 'fast' | 'normal'
  // if content is scrollable, PLEASE open it!!!, for blur will make scroll super fuzzy
  maskNoBlur?: boolean

  canClosedByMask?: boolean
  /** fired before close transform effect is end */
  onCloseImmediately?(): void
  onClose?(): void
}

export type DialogComponentHandler = {
  isOpen: boolean
  open(): void
  close(): void
}

// TODO: there should be a way use uncontroled `<Dialog>`
// TODO: composiable `useComponentHandler<Handler>(key)`
export function Dialog({
  componentId,
  componentRef,
  open,
  children,
  transitionSpeed = 'normal',
  maskNoBlur,
  canClosedByMask = true,
  onCloseImmediately,
  onClose,
  ...divProps
}: DialogProps) {
  const transitionDuration = transitionSpeed === 'fast' ? 100 : 200
  const [innerOpen, { set: setInnerOpen, on: turnOnInnerOpen, off: turnOffInnerOpen }] = useToggle(open) // for outer may have open or may not

  useTwoStateSyncer({
    state1: open,
    state2: innerOpen,
    onState1Changed: (open) => {
      setInnerOpen(Boolean(open))
    }
  })

  // load componnent handler
  useComponentHandlerRegister<DialogComponentHandler>(
    { componentId, componentRef },
    {
      isOpen: innerOpen,
      open: turnOnInnerOpen,
      close: turnOffInnerOpen
    }
  )

  // bind keyboar shortcut
  const { abortKeyboard } = useKeyboardShortcurt(document.documentElement, {
    'Escape': turnOffInnerOpen
  })
  useRecordedEffect(
    ([prevInnerOpen]) => {
      const userTryToClose = prevInnerOpen == true && innerOpen == false
      if (userTryToClose) {
        abortKeyboard()
      }
    },
    [innerOpen]
  )

  return (
    <Portal
      id={DIALOG_STACK_ID}
      zIndex={1000}
      icss={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        '*': {
          pointerEvents: 'initial'
        }
      }}
    >
      <Transition
        show={innerOpen}
        fromProps={{ icss: { opacity: 0 } }}
        toProps={{ icss: { opacity: 1 } }}
        cssTransitionDurationMs={30}
        onBeforeLeave={onCloseImmediately}
        onAfterLeave={onClose}
        icss={{ transitionDelay: innerOpen ? `${transitionDuration}ms` : '', position: 'fixed', inset: 0 }}
      >
        <Div
          className={'Dialog-mask'}
          icss={{
            background: '#0000005c',
            backdropFilter: maskNoBlur ? undefined : 'blur(10px)',
            pointerEvents: canClosedByMask ? undefined : 'none'
          }}
          onClick={turnOffInnerOpen}
        />
      </Transition>

      <Transition
        className={'Dialog-content'}
        show={innerOpen}
        fromProps={{ icss: { opacity: 0, transform: 'scale(0.95)' } }}
        toProps={{ icss: { opacity: 1, transform: 'scale(1)' } }}
        cssTransitionDurationMs={transitionDuration}
      >
        <Div
          {...divProps}
          icss={[
            {
              position: 'fixed',
              inset: 0,
              display: 'grid',
              placeContent: 'center',
              pointerEvents: 'none',
              '*': { pointerEvents: 'initial' }
            },
            divProps.icss
          ]}
        >
          {shrinkToValue(children, [{ close: turnOffInnerOpen }])}
        </Div>
      </Transition>
    </Portal>
  )
}
