import { AnyObj, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { RefObject, useImperativeHandle } from 'react'

type ComponentHandler = AnyObj

// TODO: use weakref Map
const componentHandlerStore = new Map<string, ComponentHandler>()

/** son user use the handler */
export function useComponentHandler<Handler>(id: string | number) {
  const handler = componentHandlerStore.get(String(id))
  return handler as Handler
}

/** uikit direct user regist the handler */
export function useComponentHandlerRegister<Handler extends object>(
  label: { componentId?: string | number; controller: RefObject<any> | undefined },
  inputHandler: MayFn<Handler>
) {
  if (label.componentId != null) {
    componentHandlerStore.set(String(label.componentId), shrinkToValue(inputHandler))
  }
  useImperativeHandle<any, Handler>(label.controller, () => shrinkToValue(inputHandler))
}
