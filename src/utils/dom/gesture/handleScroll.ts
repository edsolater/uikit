import { debounce, OffsetDepth, parseNumberOrPercent, createCoordinatePointsChart } from '@edsolater/fnkit'
import { onEvent, EventListenerController } from '../addEventListener'

const SCROLL_STOP_DELAY = 100 // when it is not scroll in 100ms, assumed it to stop scroll
const defaultNearlyMargin = '25%'
export interface HandleScrollOptions {
  /**
   * default `25%` height of clientHeight
   */
  nearlyMargin?: OffsetDepth
  onNearlyScrollTop?: (param: { el: HTMLElement }) => void
  onNearlyScrollBottom?: (param: { el: HTMLElement }) => void
  onScroll?: (param: {
    el: HTMLElement
    deltaY: number
    deltaX: number
    speedX: number
    speedY: number
    deltaYIn(ms: number): number
    speedYIn(ms: number): number
  }) => void
  /**
   * it's impossible to be very correct,
   */
  onScrollStop?: (param: { el: HTMLElement }) => void

  /** like addEventListener's once, but scroll is a set of callbacks, so use autoRemoveListeners */
  autoRemoveListener?: boolean
}

const weakScrollControllerMap = new WeakMap<HTMLElement, EventListenerController[]>()

export function handleScroll(el: HTMLElement, options: HandleScrollOptions) {
  // nearly only invoke once
  let prevScrollTop: number
  let prevScrollLeft: number
  let prevPerformanceTime = window.performance.now() // it not use new Date, but use web API: Performance
  const { nearlyMargin = defaultNearlyMargin, onNearlyScrollBottom, onNearlyScrollTop, onScroll } = options
  const debouncedOnStopScroll = options.onScrollStop && debounce(options.onScrollStop, { delay: SCROLL_STOP_DELAY })

  const coordinatePointsChart = createCoordinatePointsChart()
  const coordinatePointsChartX = createCoordinatePointsChart()

  const controller = onEvent(el, 'scroll', () => {
    const { scrollTop, scrollHeight, clientHeight, scrollLeft } = el
    const currentPerformanceTime = window.performance.now()
    coordinatePointsChart.addPoint({ x: currentPerformanceTime, y: scrollTop })
    coordinatePointsChartX.addPoint({ x: currentPerformanceTime, y: scrollLeft })
    const deltaTime = currentPerformanceTime - prevPerformanceTime
    const deltaY = scrollTop - prevScrollTop
    const deltaX = scrollLeft - prevScrollLeft
    prevPerformanceTime = currentPerformanceTime
    // invoke scroll
    onScroll?.({
      el,
      deltaY: deltaY,
      deltaX: deltaX,
      speedY: deltaY / deltaTime,
      speedX: deltaX / deltaTime,
      deltaYIn(ms) {
        return scrollTop - coordinatePointsChart.getY(currentPerformanceTime - ms)
      },
      speedYIn(ms) {
        return (scrollTop - coordinatePointsChart.getY(currentPerformanceTime - ms)) / ms
      }
    })

    const parsedNearlyMargin = parseNumberOrPercent(nearlyMargin, clientHeight)

    const hasComeCrossBottomBoundary =
      prevScrollTop == null ||
      (scrollTop + clientHeight >= scrollHeight - parsedNearlyMargin &&
        prevScrollTop + clientHeight < scrollHeight - parsedNearlyMargin)

    const hasComeCrossTopBoundary =
      prevScrollTop == null || (scrollTop < parsedNearlyMargin && prevScrollTop >= parsedNearlyMargin)

    if (hasComeCrossBottomBoundary) {
      onNearlyScrollBottom?.({ el })
    } else if (hasComeCrossTopBoundary) {
      onNearlyScrollTop?.({ el })
    }
    prevScrollTop = scrollTop
    prevScrollLeft = scrollLeft
    debouncedOnStopScroll?.({ el }).then((args) => {
      if (options.autoRemoveListener) {
        controller?.abort()
        weakScrollControllerMap.set(el, deleteItem(weakScrollControllerMap.get(el) ?? [], controller))
      }
      return args
    })
  })
  weakScrollControllerMap.set(el, addItem(weakScrollControllerMap.get(el) ?? [], controller))

  return controller
}

// TODO: move to fnkit
export function addItem<T>(arr: T[] | undefined, item: T): T[] {
  return [...(arr ?? []), item]
}

export function deleteItem(arr: undefined, item: unknown): undefined
export function deleteItem<T>(arr: T[], item: T): T[]
export function deleteItem<T>(arr: T[] | undefined, item: T): T[] | undefined {
  if (!arr) return
  const index = arr.indexOf(item)
  return index !== -1 ? arr : [...arr].splice(index, 1)
}
