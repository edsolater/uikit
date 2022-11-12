import { RefObject, useImperativeHandle } from 'react'
import { WeakerMap } from '@edsolater/fnkit'

type ComponentHandler = Record<string, any>

type ComponentId = string

const componentRefStore = new WeakerMap<ComponentId, RefObject<unknown>>()

export type GlobalComponentIdProps<Handler extends ComponentHandler> = {
  componentId?: string
  componentRef?: RefObject<Handler>
}

/** used in component register */
export function useComponentRefRegister(componentId: string, ref: RefObject<any>, handler: Record<string, any>) {
  useImperativeHandle(ref, () => handler)
  componentRefStore.set(componentId, ref)
}

/** used in component applier */
export function useComponentRefById<Handler extends ComponentHandler = Record<string, unknown>>(
  id?: ComponentId | undefined
) {
  if (!id) return
  return componentRefStore.get(id) as RefObject<Handler>
}
