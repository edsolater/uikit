import { useAnimationFrame } from './useAnimationFrame'

type CreateAttributeMarkerOptions = {
  /** 要被写入标记属性的目标元素。 */
  element: HTMLElement

  /** 要写入的属性名，例如 data-is-theme-switching。 */
  attributeName: string

  /**
   * 标记属性对应的值。
   * 默认写入 true，适合 data-* 开关类标记。
   */
  attributeValue?: string

  /**
   * 调用 mark 后，等待多少帧再自动移除标记。
   * 不传时表示只负责打标，不自动清理。
   */
  removeAfterFrames?: number
}

type AttributeMarker = {
  /** 写入当前 marker 对应的 attribute。 */
  mark: () => void

  /** 取消尚未完成的自动清理，并立即移除 attribute。 */
  cleanup: () => void
}

/**
 * 创建一个基于 DOM attribute 的 marker。
 * 适合表达“短暂进入某种 DOM 状态”这类语义，例如过渡保护、同步锁、busy 标记等。
 */
export function createAttributeMarker({
  element,
  attributeName,
  attributeValue = 'true',
  removeAfterFrames,
}: CreateAttributeMarkerOptions): AttributeMarker {
  const animationFrame = useAnimationFrame()

  const cleanup = () => {
    animationFrame.cancel()
    element.removeAttribute(attributeName)
  }

  const mark = () => {
    element.setAttribute(attributeName, attributeValue)

    if (removeAfterFrames === undefined) {
      return
    }

    animationFrame.request(() => {
      element.removeAttribute(attributeName)
    }, removeAfterFrames)
  }

  return {
    mark,
    cleanup,
  }
}