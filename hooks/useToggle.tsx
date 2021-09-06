import { useCallback, useMemo, useRef } from 'react'
import useBFlag from './useBFlag'

type MayFunc<T, Params extends any[] = any[]> = T | ((...params: Params) => T)
/**
 * it too widely use that there should be a hook
 * @param initValue
 *
 * @deprecated please use `useBFlay()` instead. for `useToggle()` should make a `state` and a `controller`. whitch is tedious to use.
 */
export default function useToggle(
  initValue: MayFunc<boolean> = false,
  options?: {
    /* usually it is for debug */
    onOff?(): void
    /* usually it is for debug */
    onOn?(): void
    /* usually it is for debug */
    onToggle?(): void
  }
): [
  boolean,
  {
    on: () => void
    off: () => void
    toggle: () => void
    set: (b: boolean) => void
  }
] {
  const bFlag = useBFlag(initValue, {
    onChange: (v) => {
      if (v) {
        options?.onOn?.()
      } else {
        options?.onOff?.()
      }
      options?.onToggle?.()
    }
  })
  const controller = useMemo(
    () => ({
      on: bFlag.on,
      off: bFlag.off,
      toggle: bFlag.toggle,
      set: bFlag.set
    }),
    [bFlag]
  )
  return [bFlag.value(), controller]
}

/**
 * useRef but use similar API
 * @param initValue
 */
export function useToggleRef(initValue: MayFunc<boolean> = false): [
  () => boolean,
  {
    on: () => void
    off: () => void
    toggle: () => void
  }
] {
  const isOn = useRef(typeof initValue === 'function' ? initValue() : initValue)
  const showCurrent = useCallback(() => isOn.current, [])
  const on = useCallback(() => (isOn.current = true), [])
  const off = useCallback(() => (isOn.current = false), [])
  const toggle = useCallback(() => (isOn.current = !isOn.current), [])
  const controller = useMemo(
    () => ({
      on,
      off,
      toggle
    }),
    [off, on, toggle]
  )
  return [showCurrent, controller]
}
