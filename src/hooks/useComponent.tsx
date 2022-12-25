import { onify } from '@edsolater/fnkit'
import { useRef, useState } from 'react'
type ComponentId = number | string
type ComponentHandler = Record<string, any>

const instanceCollection = onify(new Map<ComponentId, WeakRef<ComponentHandler>>())

export function registComponentHandler(componentId: ComponentId, handler: ComponentHandler) {
  instanceCollection.set(componentId, new WeakRef(handler))
}

export function getComponentHandler(componentId: ComponentId) {
  return instanceCollection.get(componentId)?.deref?.()
}

/** react useState-like {@link getComponentHandler} */
export function useComponent<Handler extends ComponentHandler>(componentId: ComponentId) {
  const [handler, setHandler] = useState<Handler | undefined>(() => {
    instanceCollection.on('set', (id, newWeakRef) => {
      const newHandler = newWeakRef.deref() as Handler | undefined
      if (newHandler && id === componentId) setHandler(newHandler)
    })
    return getComponentHandler(componentId) as Handler
  })
  return handler
}

/**  react useRef-like {@link getComponentHandler} */
export function useController<Handler extends ComponentHandler>(componentId: ComponentId) {
  const handler = useRef<Handler | undefined>(getComponentHandler(componentId) as Handler)

  instanceCollection.on('set', (id, newWeakRef) => {
    const newHandler = newWeakRef.deref() as Handler | undefined
    if (newHandler && id === componentId) {
      handler.current = newHandler
    }
  })
  return handler
}
