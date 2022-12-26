import { debounce, OffsetDepth, parseNumberOrPercent } from '@edsolater/fnkit'
import { onEvent, EventListenerController } from '../addEventListener'

const SCROLL_STOP_DELAY = 100 // when it is not scroll in 100ms, assumed it to stop scroll
export interface ScrollDetectorOptions {
  /**
   * default `25%` height of clientHeight
   */
  nearlyMargin?: OffsetDepth
  onNearlyScrollTop?: (param: { el: HTMLElement }) => void
  onNearlyScrollBottom?: (param: { el: HTMLElement }) => void
  onScroll?: (param: { el: HTMLElement }) => void
  /**
   * it's impossible to be very correct,
   */
  onScrollStop?: (param: { el: HTMLElement }) => void

  /** like addEventListener's once, but scroll is a set of callbacks, so use autoRemoveListeners */
  autoRemoveListener?: boolean
}

const weakScrollControllerMap = new WeakMap<HTMLElement, EventListenerController[]>()

export function attachScroll(el: HTMLElement, options: ScrollDetectorOptions) {
  // nearly only invoke once
  let prevScrollTop: number
  const debouncedOnStopScroll = options.onScrollStop && debounce(options.onScrollStop, { delay: SCROLL_STOP_DELAY })

  const controller = onEvent(el, 'scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = el
    const { nearlyMargin = '25%', onNearlyScrollBottom, onNearlyScrollTop, onScroll } = options
    onScroll?.({ el })

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
function addItem<T>(arr: T[] | undefined, item: T): T[] {
  return [...(arr ?? []), item]
}

function deleteItem(arr: undefined, item: unknown): undefined
function deleteItem<T>(arr: T[], item: T): T[]
function deleteItem<T>(arr: T[] | undefined, item: T): T[] | undefined {
  if (!arr) return
  const index = arr.indexOf(item)
  return index !== -1 ? arr : [...arr].splice(index, 1)
}
