import { AnyFn, Delta2dTranslate, SpeedVector } from '../../../typings/constants'

let eventId = 1
const eventIdMap = new Map<number, { el: Element; eventName: string; fn: AnyFn }>()
/**
 * listen to element' pointermove（pointerDown + pointerMove + pointerUp）clean event automaticly
 * @param el 目标元素
 * @param eventListeners
 */
export function attachPointerMove(
  el: HTMLElement | undefined | null,
  eventListeners: {
    /**  PointerDown */
    start?: (ev: { event: PointerEvent; pointEvents: PointerEvent[] }) => void
    /**  PointerDown + PointerMove */
    move?: (ev: {
      /** an alian for `eventCurrent` */
      event: PointerEvent
      pointEvents: PointerEvent[]
      currentDeltaInPx: Delta2dTranslate
      totalDelta: Delta2dTranslate
      isFirstEvent: boolean
    }) => void
    /**  PointerUp */
    end?: (ev: {
      event: PointerEvent
      pointEvents: PointerEvent[]
      currentDeltaInPx: Delta2dTranslate
      totalDeltaInPx: Delta2dTranslate
      currentSpeed: SpeedVector
    }) => void
  }
) {
  if (!el) return
  const events: { ev: PointerEvent; type: 'pointerDown' | 'pointerMove' | 'pointerUp' }[] = []
  /**
   *
   * @param {Event} ev
   */
  function pointerDown(ev: PointerEvent) {
    if (!events.length) {
      events.push({ ev, type: 'pointerDown' })
      eventListeners.start?.({ event: ev, pointEvents: events.map(({ ev }) => ev) })
      el?.addEventListener('pointermove', pointerMove, { passive: true })
      el?.addEventListener('pointerup', pointerUp, { passive: true })
      el?.setPointerCapture(ev.pointerId)
      ev.stopPropagation()
    }
  }
  function pointerMove(ev: PointerEvent) {
    const lastEvent = events[events.length - 1]?.ev
    if (events.length && ev.pointerId === lastEvent.pointerId) {
      const deltaX = ev.clientX - lastEvent.clientX
      const deltaY = ev.clientY - lastEvent.clientY
      const eventStart = events[0]?.ev
      const totalDeltaX = ev.clientX - eventStart.clientX
      const totalDeltaY = ev.clientY - eventStart.clientY
      const haveNoExistPointMove = events.every(({ type }) => type !== 'pointerMove')
      events.push({ ev, type: 'pointerMove' })
      eventListeners.move?.({
        event: ev,
        pointEvents: events.map(({ ev }) => ev),
        currentDeltaInPx: { dx: deltaX, dy: deltaY },
        totalDelta: { dx: totalDeltaX, dy: totalDeltaY },
        isFirstEvent: haveNoExistPointMove
      })
    }
  }
  function pointerUp(ev: PointerEvent) {
    const lastEvent = events[events.length - 1]?.ev
    if (events.length && ev.pointerId === lastEvent.pointerId) {
      events.push({ ev, type: 'pointerUp' })
      const eventNumber = 4
      const nearPoint = events[events.length - eventNumber]?.ev ?? events[0]?.ev
      const deltaX = ev.clientX - nearPoint.clientX
      const deltaY = ev.clientY - nearPoint.clientY
      const deltaTime = ev.timeStamp - nearPoint.timeStamp
      const eventStart = events[0].ev
      const totalDeltaX = ev.clientX - eventStart.clientX
      const totalDeltaY = ev.clientY - eventStart.clientY
      eventListeners.end?.({
        event: ev,
        pointEvents: events.map(({ ev }) => ev),
        currentDeltaInPx: { dx: deltaX, dy: deltaY },
        currentSpeed: {
          x: deltaX / deltaTime || 0,
          y: deltaY / deltaTime || 0
        },
        totalDeltaInPx: { dx: totalDeltaX, dy: totalDeltaY }
      })
      events.splice(0, events.length)
      el?.removeEventListener('pointermove', pointerMove)
    }
  }
  el?.addEventListener('pointerdown', pointerDown)
  // record it to cancel by id
  eventIdMap.set(eventId++, { el, eventName: 'pointerdown', fn: pointerDown })
  return eventId
}

export function cancelPointerMove(id: number | undefined) {
  if (!id || !eventIdMap.has(id)) return
  const { el, eventName, fn } = eventIdMap.get(id)!
  el.removeEventListener(eventName, fn)
  eventIdMap.delete(id)
}
