import { onCleanup } from 'solid-js'

type AnimationFrameCallback = () => void

type UseAnimationFrameReturn = {
  /**
   * 安排一个回调在若干帧之后执行。
   * 新请求会取消当前尚未完成的那次调度，避免重复堆积。
   */
  request: (callback: AnimationFrameCallback, waitFrames?: number) => void

  /** 取消当前还没执行到的帧调度。 */
  cancel: () => void
}

/**
 * 管理单条 animation frame 调度链。
 * 适合把 requestAnimationFrame 的取消、重入覆盖、多帧等待这些胶水逻辑收口到一处。
 */
export function useAnimationFrame(): UseAnimationFrameReturn {
  let currentFrameId: number | null = null

  const cancel = () => {
    if (currentFrameId === null) {
      return
    }

    window.cancelAnimationFrame(currentFrameId)
    currentFrameId = null
  }

  const request = (callback: AnimationFrameCallback, waitFrames = 1) => {
    cancel()

    const schedule = (remainingFrames: number) => {
      currentFrameId = window.requestAnimationFrame(() => {
        if (remainingFrames <= 1) {
          currentFrameId = null
          callback()
          return
        }

        schedule(remainingFrames - 1)
      })
    }

    schedule(Math.max(1, waitFrames))
  }

  onCleanup(cancel)

  return {
    request,
    cancel,
  }
}