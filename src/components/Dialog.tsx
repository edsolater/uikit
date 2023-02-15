import { MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode, RefObject, useEffect } from 'react'
import { Div } from '../Div/Div'
import { DivProps } from '../Div/type'
import { use2StateSyncer, useToggle } from '../hooks'
import { useComponentHandlerRegister } from '../hooks/useComponentHandler'
import { handleKeyboardShortcut } from '../utils/dom/gesture/handleKeyboardShortcut'
import { Portal } from './Portal'
import { Transition } from './Transition/Transition'

const DIALOG_STACK_ID = 'dialog-stack'

export interface DialogProps extends Omit<DivProps, 'children'> {
  status?: Ref<any>
  /** can access dialog's handler by useComponentHandler(dialogId) */
  componentId?: string | number

  open: boolean
  /** this is the className of modal card */
  children?: MayFn<ReactNode, [{ close(): void; open(): void }]>
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
  controller,
  open,
  children,
  transitionSpeed = 'normal',
  maskNoBlur,
  canClosedByMask = true,
  onCloseImmediately,
  onClose,
  ...divProps
}: DialogProps) {
  const transitionDuration = transitionSpeed === 'fast' ? 200 : 300
  const [innerOpen, { set: setInnerOpen, on: turnOnInnerOpen, off: turnOffInnerOpen }] = useToggle(open) // for outer may have open or may not

  use2StateSyncer({
    state1: open,
    state2: innerOpen,
    onState1Changed: (open) => {
      setInnerOpen(Boolean(open))
    }
  })

  // load componnent handler
  useComponentHandlerRegister<DialogComponentHandler>(
    { componentId, controller },
    {
      isOpen: innerOpen,
      open: turnOnInnerOpen,
      close: turnOffInnerOpen
    }
  )

  // bind keyboar shortcut
  useEffect(() => {
    const subscription = handleKeyboardShortcut(document.documentElement, {
      'Escape': turnOffInnerOpen
    })
    return subscription.abort
  }, [])

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
          class={'Dialog-mask'}
          icss={{
            background: '#0000001c',
            backdropFilter: maskNoBlur ? undefined : 'blur(10px)',
            pointerEvents: canClosedByMask ? undefined : 'none'
          }}
          onClick={turnOffInnerOpen}
        />
      </Transition>

      <Transition
        class={'Dialog-content'}
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
          {shrinkToValue(children, [{ close: turnOffInnerOpen, open: turnOnInnerOpen }])}
        </Div>
      </Transition>
    </Portal>
  )
}
