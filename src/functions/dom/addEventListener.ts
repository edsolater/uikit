import { addDefault, MayEnum } from '@edsolater/fnkit'
import { AnyFn } from '@edsolater/fnkit'

let eventId = 1

export interface EventListenerController {
  eventId: number
  abort(): void
}

//IDEA: maybe I should use weakMap here
// TODO: why not use native abort controller
const eventIdMap = new Map<
  number,
  { el: HTMLElement | Document | Window | undefined | null; eventName: string; cb: AnyFn }
>()

// Todo: prettier type
export function addEventListener<
  El extends HTMLElement | Document | Window | undefined | null,
  K extends MayEnum<keyof HTMLElementEventMap>
>(
  el: El,
  eventName: K,
  fn: (payload: {
    ev: K extends keyof HTMLElementEventMap ? HTMLElementEventMap[K] : Event
    el: El
    eventListenerController: EventListenerController
  }) => void,
  /** default is `{ passive: true }` */
  options?: AddEventListenerOptions
): EventListenerController {
  const defaultedOptions = addDefault(options ?? {}, { passive: true })

  const targetEventId = eventId++
  const controller = {
    eventId: targetEventId,
    abort() {
      cleanEventListener(targetEventId)
    }
  }
  const newEventCallback = (ev) => {
    fn({ el, ev, eventListenerController: controller })
  }
  el?.addEventListener(eventName as unknown as string, newEventCallback, defaultedOptions)
  eventIdMap.set(targetEventId, { el, eventName: eventName as unknown as string, cb: newEventCallback })
  return controller
}

function cleanEventListener(id: number | undefined | null) {
  if (!id || !eventIdMap.has(id)) return
  const { el, eventName, cb } = eventIdMap.get(id)!
  console.log('444: ', 444, el, eventName, cb)
  el?.removeEventListener(eventName, cb)
  eventIdMap.delete(id)
}
