import { AnyFn } from '@edsolater/fnkit'

let eventId = 1

export interface EventListenerController {
  eventId: number
  cancel(): void
}

export interface EventListenerOptions extends AddEventListenerOptions {
  stopPropergation?: boolean
  onlyTargetIsSelf?: boolean
}

//IDEA: maybe I should use weakMap here
// TODO: why not use native cancel controller
const eventIdMap = new Map<number, { el: Element | undefined | null; eventName: string; cb: AnyFn }>()

// TODO: !!! move to domkit
export function addEventListener<El extends Element | undefined | null, K extends keyof GlobalEventHandlersEventMap>(
  el: El,
  eventName: K,
  fn: (payload: {
    ev: GlobalEventHandlersEventMap[K]
    el: El
    eventListenerController: EventListenerController
  }) => void,
  /** default is `{ passive: true }` */
  options?: EventListenerOptions
): EventListenerController {
  const defaultedOptions = { passive: true, ...options }
  const targetEventId = eventId++
  const controller = {
    eventId: targetEventId,
    cancel() {
      removeEventListener(targetEventId, options)
    }
  }
  const newEventCallback = (ev: Event) => {
    if (options?.stopPropergation) ev.stopPropagation()
    if (options?.onlyTargetIsSelf && el !== ev.target) return
    fn({ el, ev: ev as GlobalEventHandlersEventMap[K], eventListenerController: controller })
  }
  el?.addEventListener(eventName as unknown as string, newEventCallback, defaultedOptions)
  eventIdMap.set(targetEventId, { el, eventName: eventName as unknown as string, cb: newEventCallback })
  return controller
}

function removeEventListener(id: number | undefined | null, options?: EventListenerOptions) {
  console.log('id: ', id)
  if (!id || !eventIdMap.has(id)) return
  const { el, eventName, cb } = eventIdMap.get(id)!
  console.log('cb ', el)
  el?.removeEventListener(eventName, cb, { capture: Boolean(options?.capture) })
  eventIdMap.delete(id)
}
