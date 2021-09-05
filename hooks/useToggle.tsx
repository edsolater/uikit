import { useCallback, useMemo, useRef, useState } from 'react'
type MayFunc<T, Params extends any[] = any[]> = T | ((...params: Params) => T)
/**
 * it too widely use that there should be a hook
 * @param initValue
 */
export default function useToggle(
  initValue: MayFunc<boolean> = false,
  options: {
    /* usually it is for debug */
    onOff?(): void
    /* usually it is for debug */
    onOn?(): void
    /* usually it is for debug */
    onToggle?(): void
  } = {}
): [
  boolean,
  {
    on: () => void
    off: () => void
    toggle: () => void
    set: (b: boolean) => void
  }
] {
  const [isOn, _setIsOn] = useState(initValue)
  const setIsOn = (...params: any[]) => {
    //@ts-expect-error temp
    _setIsOn(...params)
  }
  const on = useCallback(() => {
    setIsOn(true)
    options.onOn?.()
  }, [])
  const off = useCallback(() => {
    setIsOn(false)
    options.onOff?.()
  }, [])
  const toggle = useCallback(() => {
    setIsOn((b: any) => !b)
    options.onToggle?.()
  }, [])
  const controller = useMemo(
    () => ({
      on,
      off,
      toggle,
      set: setIsOn
    }),
    [off, on, toggle, setIsOn]
  )
  return [isOn, controller]
}

/**
 * useRef but use similar API
 * @param initValue
 */
export function useToggleRef(
  initValue: MayFunc<boolean> = false
): [
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
