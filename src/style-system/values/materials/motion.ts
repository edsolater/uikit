/** 时长与缓动材料；减少动效偏好将默认时长归零。 */
import { value } from '../../core/css-value'
import { variable } from '../../core/css-variable'
import { calcMultiply } from '../functions/calc'

/** 快速反馈的基础时长，单位为毫秒。 */
export const baseFastDuration = value('120ms')

/** 完整动效的时长倍率，保留原时长。 */
export const fullMotionMultiplier = value(1)

/** 减少动效的时长倍率，将时长缩至零。 */
export const reducedMotionMultiplier = value(0)

/** 快速起步、逐渐收稳的缓动曲线。 */
export const standardEasingCurve = value('cubic-bezier(0.2, 0, 0, 1)')

/** 系统动效倍率；减少动效偏好默认将时长缩至零。 */
const motionDurationMultiplier = variable('sys-motion-scale', {
  root: { value: fullMotionMultiplier, reducedMotion: reducedMotionMultiplier },
})

/**
 * 可覆盖的快速过渡时长，默认将 120ms 乘以动效倍率。
 * @example transition(['opacity', fastDuration, standardEasing]) // 通常过渡 120ms；减少动效时为 0ms。
 */
export const fastDuration = variable('motion-duration-fast', {
  root: {
    value: calcMultiply(baseFastDuration, motionDurationMultiplier),
  },
})

/** 可覆盖的标准缓动曲线。 */
export const standardEasing = variable('motion-ease-standard', { root: { value: standardEasingCurve } })
