import { MayFn } from '@edsolater/fnkit'
import { RefObject, useMemo, Dispatch, SetStateAction, useCallback } from 'react'
import { useSignal, UseSignal } from './useSignal'

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
export default function useToggle(
  initValue: MayFn<boolean> = false,
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
  const { state, ...restControls } = useToggleByBase(useSignal(initValue), options ?? {})
  return [state(), restControls]
}

/**
 * it too widely use that there should be a hook
 * @param initValue
 */
export function useToggleRef(
  initValue: MayFn<boolean> = false,
  options: {
    /**only affact delay-* and canelDelayAction */
    delay?: number
    /* usually it is for debug */
    onOff?(): void
    /* usually it is for debug */
    onOn?(): void
    /* usually it is for debug */
    onToggle?(): void
  } = {}
): UseToggleRefReturn {
  const { state, ...restControls } = useToggleByBase(useSignal(initValue), options ?? {})
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

function useToggleByBase<S extends boolean>(
  base: UseSignal<S>,
  options: {
    /**only affact delay-* and canelDelayAction */
    delay?: number
    /* usually it is for debug */
    onOff?(): void
    /* usually it is for debug */
    onOn?(): void
    /* usually it is for debug */
    onToggle?(): void
  }
): UseSignal<S, ToggleController> {
  const opts = { delay: 800, ...options }
  const { state: delayActionId, setState: setDelayActionId } = useSignal<number>(0)
  const setIsOn = (dispatch: any) => {
    base.setState(dispatch)
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
    ...base,
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
