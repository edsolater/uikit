import { calcHypotenuse, staySameSign } from '@edsolater/fnkit'
import { Delta2dTranslate, SpeedVector, Vector, Direction } from '@edsolater/fnkit' // these type should not in fnkit
import { RefObject, useEffect } from 'react'
import { handlePointerMove } from '../utils/dom/gesture/handlePointerMove'
import { setTranslate } from '../utils/dom/setTranslate'
import { useToggle } from './useToggle'

export const DIRECTION = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right'
} as const
export type DIRECTION = typeof DIRECTION
export interface FeatureMoveOptions {
  /* ----------------------------------- 拖动 ----------------------------------- */

  disable?: boolean
  direction?: 'x' | 'y' | 'both'
  /** 可拖动的区域 */
  moveBoundary?: 'offsetParent' | 'none'
  onMoveStart?: (ev: { el: HTMLElement }) => void
  onMoveEnd?: (ev: { el: HTMLElement; speedVector: Vector }) => void
  onMove?: (ev: {
    /**
     * target element
     */
    el: HTMLElement

    /**
     *  a move piece  from last position
     */
    delta: Delta2dTranslate

    /**
     * move distance from moveStart
     */
    // TODO: deltaTotal: Delta2dTranslate
  }) => void
  onReachOffsetBoundary?: (el: HTMLElement, boundary: 'left' | 'top' | 'right' | 'bottom') => void

  /* ---------------------------------- (惯性)滑动 ---------------------------------- */

  /** 开启惯性滑动 */
  canSlide?: boolean
  /** （前提：已开启惯性滚动）惯性滑动中，地面摩擦的加速度，即，速度变化的快慢 */
  acc?: number
  /** （前提：已开启惯性滚动）惯性滑动的最大初速度（的绝对值） */
  maxInitSpeed?: number
  onSlideEnd?: (el: HTMLElement) => void
}

/**
 * @hook feature move
 * this will set css variable on the element
 *
 * `--x` `--y` show how much distance does element move. number of px.
 *
 * @example
 * useFeatureMove(contentRef, {
 *   direction: 'y',
 *   onMoveStart() {
 *     disableIsScrollingByThumb()
 *   },
 *   onMoveEnd() {
 *     enableIsScrollingByThumb()
 *   },
 *   onMove({ delta }) {
 *     const content = contentRef.current!
 *     const thumbScrollDeltaTop = delta.dy
 *     const contentScrollTop = thumbScrollDeltaTop * (content.scrollHeight / content.clientHeight)
 *     contentRef.current!.scrollBy({ top: contentScrollTop })
 *   }
 * })
 */
export function useFeatureMove(
  component: RefObject<HTMLElement>,
  {
    disable = false,
    canSlide = false,
    acc = 0.004,
    maxInitSpeed = 2,
    moveBoundary = 'offsetParent',
    direction = 'both',
    onMoveStart,
    onMove,
    onReachOffsetBoundary,
    onMoveEnd,
    onSlideEnd
  }: FeatureMoveOptions = {}
) {
  const [isMoving, { on: setIsMoving, off: cancelIsMoving }] = useToggle(false)
  useEffect(() => {
    if (disable) return
    const el = component.current!
    const offsetRect =
      // todo: 不更新的话，一滚动就没了
      moveBoundary === 'offsetParent' ? el.offsetParent?.getBoundingClientRect() : undefined
    handlePointerMove(el, {
      start() {
        onMoveStart?.({ el })
        setIsMoving()
        // TODO:此时应该更新offsetRect的, 或者用resizeObserver监控更新
      },
      move({ pointEvents }) {
        const prev = pointEvents[pointEvents.length - 2]!
        const curr = pointEvents[pointEvents.length - 1]!
        const dx = curr.x - prev.x
        const dy = curr.y - prev.y
        let computedDx = 0
        let computedDy = 0
        let moveboxRect: DOMRect | undefined = undefined
        if (direction === 'both' || direction === 'x') {
          computedDx = dx
          if (offsetRect) {
            if (!moveboxRect) moveboxRect = el.getBoundingClientRect()
            if (offsetRect.left > dx + moveboxRect.left) {
              computedDx = offsetRect.left - moveboxRect.left
              requestIdleCallback(() => onReachOffsetBoundary?.(el, DIRECTION.LEFT))
            } else if (offsetRect.right < dx + moveboxRect.right) {
              computedDx = offsetRect.right - moveboxRect.right
              requestIdleCallback(() => onReachOffsetBoundary?.(el, DIRECTION.RIGHT))
            }
          }
        }
        if (direction === 'both' || direction === 'y') {
          computedDy = dy
          if (offsetRect) {
            if (!moveboxRect) moveboxRect = el.getBoundingClientRect()
            if (offsetRect.top > moveboxRect.top + dy) {
              computedDy = offsetRect.top - moveboxRect.top
              requestIdleCallback(() => onReachOffsetBoundary?.(el, DIRECTION.TOP))
            } else if (offsetRect.bottom < moveboxRect.bottom + dy) {
              computedDy = offsetRect.bottom - moveboxRect.bottom
              requestIdleCallback(() => onReachOffsetBoundary?.(el, DIRECTION.BOTTOM))
            }
          }
        }
        const computedDelta: Delta2dTranslate = {
          dx: computedDx,
          dy: computedDy
        }
        onMove?.({ el, delta: computedDelta })
        setTranslate(el, computedDelta)
      },
      end({ currentSpeed: speedVector }) {
        onMoveEnd?.({ el, speedVector })
        cancelIsMoving()
        if (canSlide) {
          inertialSlide(el, {
            speedVector,
            acc,
            maxInitSpeed,
            boundingBox: offsetRect,
            onSlideEnd: () => {
              onSlideEnd?.(el)
            }
          })
        }
      }
    })
  }, [])
  return [isMoving, { on: setIsMoving, off: cancelIsMoving }]
}

export type BoundingRect = {
  left: number
  top: number
  right: number
  bottom: number
}
/**
 * （用于惯性滑动）
 * 根据初始速度，设定--x与--y
 * 用到的 webAPI：requestAnimationFrame（JS添加惯性滑动的动画）
 * @param el 目标元素
 * @param speedVector 初始速度的向量表示（x，y坐标）
 */
export function inertialSlide(
  el: HTMLElement,
  {
    speedVector,
    acc = 0.004,
    maxInitSpeed = 3,
    boundingBox,
    onSlideEnd
  }: {
    speedVector: SpeedVector
    acc?: number
    maxInitSpeed?: number
    boundingBox?: BoundingRect
    onSlideEnd?: () => void
  }
) {
  const totalSpeedValue = calcHypotenuse(speedVector.x, speedVector.y)
  const accInX = -acc * (speedVector.x / calcHypotenuse(speedVector.x, speedVector.y)) // x方向上的摩擦力加速度
  const accInY = -acc * (speedVector.y / calcHypotenuse(speedVector.x, speedVector.y)) // y方向上的摩擦力加速度
  const rect = el.getBoundingClientRect()
  const elPosition: BoundingRect = {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom
  }
  let lastTimestamp = performance.now()
  let lastVector = {
    x: speedVector.x * (totalSpeedValue > maxInitSpeed ? maxInitSpeed / totalSpeedValue : 1),
    y: speedVector.y * (totalSpeedValue > maxInitSpeed ? maxInitSpeed / totalSpeedValue : 1)
  }

  //TODO: 这个animationFrame的命名机制可以封装起来
  function animateFunction(timestamp: number) {
    const elapsed = timestamp - lastTimestamp
    lastTimestamp = timestamp
    const currentVector = {
      x: staySameSign(lastVector.x + accInX * elapsed, -accInX),
      y: staySameSign(lastVector.y + accInY * elapsed, -accInY)
    }
    let dx = ((lastVector.x + currentVector.x) / 2) * elapsed
    let dy = ((lastVector.y + currentVector.y) / 2) * elapsed
    elPosition.left += dx
    elPosition.right += dx
    elPosition.top += dy
    elPosition.bottom += dy
    if (boundingBox && elPosition.left <= boundingBox.left) {
      dx += boundingBox.left - elPosition.left
      elPosition.left = boundingBox.left
    }
    if (boundingBox && elPosition.right >= boundingBox.right) {
      dx += boundingBox.right - elPosition.right
      elPosition.right = boundingBox.right
    }
    if (boundingBox && elPosition.top <= boundingBox.top) {
      dy += boundingBox.top - elPosition.top
      elPosition.top = boundingBox.top
    }
    if (boundingBox && elPosition.bottom >= boundingBox.bottom) {
      dy += boundingBox.bottom - elPosition.bottom
      elPosition.bottom = boundingBox.bottom
    }
    lastVector = currentVector
    if (dx !== 0 || dy !== 0) {
      setTranslate(el, { dx, dy })
      window.requestAnimationFrame(animateFunction)
    } else {
      onSlideEnd?.()
    }
  }
  window.requestAnimationFrame(animateFunction)
}
