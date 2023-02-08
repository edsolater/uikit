import React, { useEffect, useRef } from 'react'
import { attachScroll, ScrollDetectorOptions } from '../../utils/dom/gesture/scroll'

interface UseScrollDetectorRefOptions extends ScrollDetectorOptions {
  disabled?: boolean // unlike props:lock, it will not recode any callback. (mute totally)
  lock?: boolean // will intercept any method to be call, but callbacks during lock will released when unlocked
}

export function useScrollCallbackRef(options: UseScrollDetectorRefOptions): React.RefObject<HTMLDivElement> {
  //  useRef to avoid js closure pitfall (stay sync with fresh options)
  const optionsRef = useRef(options)
  optionsRef.current = options

  type StashCallbacks = {
    onNearlyScrollTop?: (() => ReturnType<NonNullable<UseScrollDetectorRefOptions['onNearlyScrollTop']>>)[]
    onNearlyScrollBottom?: (() => ReturnType<NonNullable<UseScrollDetectorRefOptions['onNearlyScrollBottom']>>)[]
    onScroll?: (() => ReturnType<NonNullable<UseScrollDetectorRefOptions['onScroll']>>)[]
  }
  // for lock
  const stashedCallbacks = useRef<StashCallbacks>({})

  useEffect(() => {
    if (!options.lock) {
      Object.values(stashedCallbacks.current).forEach((callbacks) => callbacks.forEach((callback) => callback()))
      stashedCallbacks.current = { onNearlyScrollBottom: [], onNearlyScrollTop: [], onScroll: [] }
    }
  }, [options.lock])

  const scrollBoxDomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!scrollBoxDomRef.current) return
    attachScroll(scrollBoxDomRef.current, {
      ...optionsRef.current,
      onScroll: ({ el }) => {
        if (optionsRef.current.disabled) return // disable will not record callback
        if (optionsRef.current.lock) {
          stashedCallbacks.current.onScroll = [() => optionsRef.current.onScroll?.({ el })]
        } else {
          optionsRef.current.onScroll?.({ el })
        }
      },
      onNearlyScrollTop: ({ el }) => {
        if (optionsRef.current.disabled) return // disable will not record callback
        if (optionsRef.current.lock) {
          stashedCallbacks.current.onNearlyScrollTop = [() => optionsRef.current.onNearlyScrollTop?.({ el })]
        } else {
          optionsRef.current.onNearlyScrollTop?.({ el })
        }
      },
      onNearlyScrollBottom: ({ el }) => {
        if (optionsRef.current.disabled) return // disable will not record callback
        if (optionsRef.current.lock) {
          stashedCallbacks.current.onNearlyScrollBottom = [() => optionsRef.current.onNearlyScrollBottom?.({ el })]
        } else {
          optionsRef.current.onNearlyScrollBottom?.({ el })
        }
      }
    })
  }, [])
  return scrollBoxDomRef
}
