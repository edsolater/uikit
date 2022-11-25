import { MayFn } from '@edsolater/fnkit'
import { Dispatch, RefObject, SetStateAction, useCallback, useMemo } from 'react'
import { useCallbackRef } from './useCallbackRef'
import { UseSignal, useSignal } from './useSignal'

export interface ToggleSyncFunction {
  on(): void
  off(): void
  toggle(): void
  set(b: boolean): void
}
type ToggleController = {
  delayOn(): void
  delayOff(): void
  delayToggle(): void
  delaySet(): void
  cancelDelayAction(): void
  on(): void
  off(): void
  toggle(): void
  set(b: boolean): void
}

export type UseToggleReturn = [boolean, ToggleController]
export type UseToggleRefReturn = [RefObject<boolean>, ToggleController]

/**
 * it too widely use that there should be a hook
 * @param initValue
 *
 */
export function useToggle(initValue: MayFn<boolean> = false, options?: UseToggleOptions): UseToggleReturn {
  const { state, ...restControls } = useToggleByBase(initValue, options ?? {})
  return [state(), restControls]
}

/**
 * it too widely use that there should be a hook
 * @param initValue
 */
export function useToggleRef(initValue: MayFn<boolean> = false, options: UseToggleOptions = {}): UseToggleRefReturn {
  const { state, ...restControls } = useToggleByBase(initValue, options ?? {})
  const simulate = useMemo(
    () => ({
      get current() {
        return state()
      }
    }),
    []
  )
  return [simulate, restControls]
}

export function createToggleController<T extends Dispatch<SetStateAction<any>>>(setState: T) {
  return {
    on: () => setState(true),
    off: () => setState(false),
    toggle: () => setState((b: any) => !b),
    set: (newState: any) => setState(newState)
  }
}

type UseToggleOptions = {
  /**only affact delay-* and canelDelayAction */
  delay?: number
  /* usually it is for debug */
  onOff?(): void
  /* usually it is for debug */
  onOn?(): void
  /* usually it is for debug */
  onToggle?(): void
  onChange?(isOn: boolean, prev?: boolean): void
}

function useToggleByBase(initValue: MayFn<boolean>, options: UseToggleOptions): UseSignal<boolean, ToggleController> {
  const opts = { delay: 800, ...options }
  const signal = useSignal(initValue, { onChange: opts.onChange })
  const { state: delayActionId, setState: setDelayActionId } = useSignal<number | NodeJS.Timeout>(0)
  const setIsOn = (...params: any[]) => {
    //@ts-expect-error temp
    signal.setState(...params)
  }

  //#region ------------------- controls -------------------
  const cancelDelayAction = useCallback(() => {
    globalThis.clearTimeout(delayActionId())
  }, [delayActionId])
  const on = useCallback(() => {
    cancelDelayAction()
    setIsOn(true)
    opts.onOn?.()
  }, [cancelDelayAction])
  const off = useCallback(() => {
    cancelDelayAction()
    setIsOn(false)
    opts.onOff?.()
  }, [cancelDelayAction])
  const toggle = useCallback(() => {
    cancelDelayAction()
    setIsOn((b: any) => {
      if (b) opts.onOff?.()
      if (!b) opts.onOn?.()
      return !b
    })
    opts.onToggle?.()
  }, [cancelDelayAction])
  const delayOn = useCallback(() => {
    cancelDelayAction()
    const actionId = globalThis.setTimeout(on, opts.delay)
    setDelayActionId(actionId)
  }, [cancelDelayAction])
  const delayOff = useCallback(() => {
    cancelDelayAction()
    const actionId = globalThis.setTimeout(off, opts.delay)
    setDelayActionId(actionId)
  }, [cancelDelayAction])
  const delayToggle = useCallback(() => {
    cancelDelayAction()
    const actionId = globalThis.setTimeout(toggle, opts.delay)
    setDelayActionId(actionId)
  }, [cancelDelayAction])
  const delaySet = useCallback(() => {
    cancelDelayAction()
    const actionId = globalThis.setTimeout(setIsOn, opts.delay)
    setDelayActionId(actionId)
  }, [cancelDelayAction])
  //#endregion

  return {
    ...signal,
    cancelDelayAction,
    delayOn,
    delayOff,
    delayToggle,
    delaySet,

    on,
    off,
    toggle,
    set: setIsOn
  }
}
