import { RefObject, useImperativeHandle } from 'react'
import { flapDeep, MayDeepArray, WeakerMap } from '@edsolater/fnkit'
import { ControllerRef } from '../typings/tools'

type ComponentHandler = Record<string, any>

type ComponentId = string

const controllerStore = new WeakerMap<ComponentId, ControllerRef<unknown>>()

export type GlobalComponentIdProps<Handler extends ComponentHandler> = {
  componentId?: string
  status?: Ref<Handler>
}

/** used in component register */
export function useControllerRegister(
  componentId: string | undefined,
  refs: MayDeepArray<ControllerRef<any>>,
  handler: Record<string, any>
) {
  flapDeep(refs).map(ref=>{
    useImperativeHandle(ref, () => handler)
    if (componentId) controllerStore.set(componentId, ref)
  })
}

/** used in component applier */
export function useControllerById<Handler extends ComponentHandler = Record<string, unknown>>(
  id?: ComponentId | undefined
) {
  if (!id) return
  return controllerStore.get(id) as ControllerRef<Handler>
}
