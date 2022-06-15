import { MayFn, shrinkToValue } from '@edsolater/fnkit'
import { useSignalState, useToggleRef } from '@edsolater/hookit'
import { Dialog as _Dialog, Transition } from '@headlessui/react'
import React, { CSSProperties, Fragment, ReactNode, useEffect, useRef, useState } from 'react'
import { useTwoStateSyncer } from '../hooks/use2StateSyncer.temp'
import { Div } from './Div'

export interface DialogProps {
  open: boolean
  /** this is the className of modal card */
  className?: string
  style?: CSSProperties
  children?: MayFn<ReactNode, [{ close: () => void }]>
  transitionSpeed?: 'fast' | 'normal'
  // if content is scrollable, PLEASE open it!!!, for blur will make scroll super fuzzy
  maskNoBlur?: boolean

  canClosedByMask?: boolean
  /** fired before close transform effect is end */
  onCloseImmediately?(): void
  onClose?(): void
}

// FIXME: should no headlessui and tailwind
export function Dialog({
  open,
  children,
  className,
  transitionSpeed = 'normal',
  maskNoBlur,
  style,
  canClosedByMask = true,
  onCloseImmediately,
  onClose
}: DialogProps) {
  // for onCloseTransitionEnd
  // during leave transition, open is still true, but innerOpen is false, so transaction will happen without props:open has change (if open is false, React may destory this component immediately)
  const [innerOpen, setInnerOpen, innerOpenSignal] = useSignalState(open)

  const [isDuringTransition, { delayOff: transactionFlagDelayOff, on: transactionFlagOn }] = useToggleRef(false, {
    delay: transitionSpeed === 'fast' ? 100 : 200 /* transition time */,
    onOff: () => {
      // seems headlessui/react 1.6 doesn't fired this certainly(because React 16 priority strategy), so i have to use setTimeout 👇 in <Dialog>'s onClose
      if (!innerOpenSignal()) {
        onClose?.()
      }
    }
  })

  const openDialog = () => {
    setInnerOpen(true)
    transactionFlagOn() // to make sure 👇 setTimout would not remove something if transaction has canceled
    transactionFlagDelayOff()
  }

  const closeDialog = () => {
    setInnerOpen(false)
    transactionFlagOn() // to make sure 👇 setTimout would not remove something if transaction has canceled
    transactionFlagDelayOff()
  }

  useTwoStateSyncer({
    state1: open,
    state2: innerOpen,
    onState1Changed: (open) => {
      open ? openDialog() : closeDialog()
    }
  })

  if (!open) return null
  return (
    <Transition
      as={Fragment}
      show={innerOpen}
      appear
      beforeLeave={onCloseImmediately}
      // afterLeave={() => {
      //   // seems headlessui/react 1.6 doesn't fired this certainly(because React 16 priority strategy), so i have to use setTimeout 👇 in <Dialog>'s onClose
      //   console.log('onCloseTransitionEnd')
      //   return onCloseTransitionEnd?.()
      // }}
    >
      <_Dialog open={innerOpen} static as='div' className='fixed inset-0 z-model overflow-y-auto' onClose={closeDialog}>
        <Div
          className='Dialog'
          icss={{
            width: '100vw',
            height: '100vh',
            position: 'fixed'
          }}
        >
          <Transition.Child
            as={Fragment}
            enter={`ease-out ${transitionSpeed === 'fast' ? 'duration-150' : 'duration-300'} transition`}
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave={`ease-in ${transitionSpeed === 'fast' ? 'duration-100' : 'duration-200'} transition`}
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <_Dialog.Overlay
              className={`fixed inset-0 ${maskNoBlur ? '' : 'backdrop-filter backdrop-blur'} bg-[rgba(20,16,65,0.4)] ${
                canClosedByMask ? '' : 'pointer-events-none'
              }`}
            />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter={`ease-out ${transitionSpeed === 'fast' ? 'duration-150' : 'duration-300'}`}
            enterFrom='opacity-0 scale-95'
            enterTo='opacity-100 scale-100'
            leave={`ease-in ${transitionSpeed === 'fast' ? 'duration-100' : 'duration-200'}`}
            leaveFrom='opacity-100 scale-100'
            leaveTo='opacity-0 scale-95'
          >
            <div
              className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2  transition-all z-10 self-pointer-events-none`}
              style={style}
            >
              <div
                style={{
                  /** to comply to the space occupation of side-bar */
                  transform: 'translateX(calc(var(--side-menu-width) * 1px / 2))'
                }}
              >
                {shrinkToValue(children, [{ close: closeDialog }])}
              </div>
            </div>
          </Transition.Child>
        </Div>
      </_Dialog>
    </Transition>
  )
}
