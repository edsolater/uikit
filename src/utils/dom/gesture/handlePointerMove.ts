import { onEvent, EventListenerController } from '../addEventListener'

type DeltaTranslate2D = {
  dx: number
  dy: number
}
type SpeedVector = {
  x: number
  y: number
}

export type HandlePointerMovePointDownFn<El extends Element> = (utilities: {
  el: El
  ev: PointerEvent
  pointEvents: PointerEvent[]
}) => void

export type HandlePointerMovePointMoveFn<El extends Element> = (utilities: {
  el: El
  ev: PointerEvent
  pointEvents: PointerEvent[]
  currentDelta: DeltaTranslate2D
  totalDelta: DeltaTranslate2D
  isFirstEvent: boolean
}) => void

export type HandlePointerMovePointUpFn<El extends Element> = (utilities: {
  el: El
  ev: PointerEvent
  pointEvents: PointerEvent[]
  currentDelta: DeltaTranslate2D
  totalDelta: DeltaTranslate2D
  currentSpeed: SpeedVector
}) => void

export type HandlePointerMoveOptions<El extends Element> = {
  start?: HandlePointerMovePointDownFn<El>
  move?: HandlePointerMovePointMoveFn<El>
  end?: HandlePointerMovePointUpFn<El>
}

/**
 * listen to element' pointermove(pointerDown + pointerMove + pointerUp) clean event automaticly
 * @param el target element
 * @param options
 */
export function handlePointerMove<El extends HTMLElement>(el: El, options: HandlePointerMoveOptions<El>) {
  const eventsQueue: { ev: PointerEvent; type: 'pointerDown' | 'pointerMove' | 'pointerUp' }[] = []
  let pointDownController: EventListenerController | null = null
  let pointMoveController: EventListenerController | null = null
  let pointUpController: EventListenerController | null = null

  function pointerDown(ev: PointerEvent) {
    if (!eventsQueue.length) {
      eventsQueue.push({ ev, type: 'pointerDown' })
      options.start?.({ el: ev.target as El, ev, pointEvents: eventsQueue.map(({ ev }) => ev) })
      pointMoveController = onEvent(el, 'pointermove', ({ ev }) => pointerMove(ev), {
        passive: true,
        onlyTargetIsSelf: true
      })
      pointUpController = onEvent(el, 'pointerup', ({ ev }) => pointerUp(ev), {
        passive: true,
        once: true,
        onlyTargetIsSelf: true
      })
      el?.setPointerCapture(ev.pointerId)
      ev.stopPropagation()
    }
  }

  function pointerMove(ev: PointerEvent) {
    const lastEvent = eventsQueue[eventsQueue.length - 1]?.ev
    if (eventsQueue.length && ev.pointerId === lastEvent.pointerId) {
      const deltaX = ev.clientX - lastEvent.clientX
      const deltaY = ev.clientY - lastEvent.clientY
      const eventStart = eventsQueue[0]?.ev
      const totalDeltaX = ev.clientX - eventStart.clientX
      const totalDeltaY = ev.clientY - eventStart.clientY
      const haveNoExistPointMove = eventsQueue.every(({ type }) => type !== 'pointerMove')
      eventsQueue.push({ ev, type: 'pointerMove' })
      options.move?.({
        el: ev.target as El,
        ev,
        pointEvents: eventsQueue.map(({ ev }) => ev),
        currentDelta: { dx: deltaX, dy: deltaY },
        totalDelta: { dx: totalDeltaX, dy: totalDeltaY },
        isFirstEvent: haveNoExistPointMove
      })
    }
  }

  function pointerUp(ev: PointerEvent) {
    const lastEvent = eventsQueue[eventsQueue.length - 1]?.ev
    if (eventsQueue.length && ev.pointerId === lastEvent.pointerId) {
      eventsQueue.push({ ev, type: 'pointerUp' })
      const eventNumber = 4
      const nearPoint = eventsQueue[eventsQueue.length - eventNumber]?.ev ?? eventsQueue[0]?.ev
      const deltaX = ev.clientX - nearPoint.clientX
      const deltaY = ev.clientY - nearPoint.clientY
      const deltaTime = ev.timeStamp - nearPoint.timeStamp
      const eventStart = eventsQueue[0].ev
      const totalDeltaX = ev.clientX - eventStart.clientX
      const totalDeltaY = ev.clientY - eventStart.clientY
      options.end?.({
        el: ev.target as El,
        ev,
        pointEvents: eventsQueue.map(({ ev }) => ev),
        currentDelta: { dx: deltaX, dy: deltaY },
        currentSpeed: {
          x: deltaX / deltaTime || 0,
          y: deltaY / deltaTime || 0
        },
        totalDelta: { dx: totalDeltaX, dy: totalDeltaY }
      })
      eventsQueue.splice(0, eventsQueue.length)
      pointMoveController?.abort()
    }
  }

  pointDownController = onEvent(el, 'pointerdown', ({ ev }) => pointerDown(ev), { onlyTargetIsSelf: true })
  return {
    pointDownController,
    pointMoveController,
    pointUpController,
    cancel() {
      pointDownController?.abort()
    }
  }
}
