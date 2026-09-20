/** 时长与缓动材料；减少动效偏好将默认时长归零。 */
import { value } from '../core/css-value'
import { variable } from '../core/css-variable'
import { calcMultiply } from '../values/functions/calc'

/** 完整动效的时长倍率，保留原时长。 */
export const fullMotion = value(1)

/** 减少动效的时长倍率，将时长缩至零。 */
export const reducedMotion = value(0)

/** 系统动效倍率；减少动效偏好默认将时长缩至零。 */
const motionScaleRatio = variable(undefined, { name: 'motion-scale-ratio', root: { value: fullMotion, reducedMotion: reducedMotion } })

/** 快速反馈的基础时长，单位为毫秒。 */
export const fastBase = value('120ms')

/**
 * 可覆盖的快速过渡时长，默认将 120ms 乘以动效倍率。
 * @example [$transition, transitionValue([$opacity, fastDuration, standardEasing])] // 通常过渡 120ms；减少动效时为 0ms。
 */
export const fastDuration = variable(undefined, {
  name: 'fast-duration', root: {
    value: calcMultiply(fastBase, motionScaleRatio),
  }
})

/** 快速起步、逐渐收稳的缓动曲线。 */
export const standardCurve = value('cubic-bezier(0.2, 0, 0, 1)')

/** 可覆盖的标准缓动曲线。 */
export const standardEasing = variable(undefined, { name: 'standard-easing', root: { value: standardCurve } })
