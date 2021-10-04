import { AnyFn } from '../../typings/constants'

let eventId = 1

//IDEA: maybe I should use weakMap here
// TODO: why not use native abort controller
const eventIdMap = new Map<number, { el: Element; eventName: string; fn: AnyFn }>()

// Todo: prettier type
export default function addEventListener<El extends HTMLElement>(
  el: El,
  eventName: HTMLElementEventMap | ({} & string),
  fn: (ev: Event) => void,
  options?: boolean | AddEventListenerOptions
): EventListenerController {
  el.addEventListener(eventName as unknown as string, fn, options)
  const targetEventId = eventId++
  eventIdMap.set(targetEventId, { el, eventName: eventName as unknown as string, fn })
  return {
    eventId: targetEventId,
    stopListening() {
      cleanEventListener(targetEventId)
    }
  }
}

function cleanEventListener(id: number | undefined) {
  if (!id || !eventIdMap.has(id)) return
  const { el, eventName, fn } = eventIdMap.get(id)!
  el.removeEventListener(eventName, fn)
  eventIdMap.delete(id)
}

interface EventListenerController {
  eventId: number
  stopListening(): void
}
