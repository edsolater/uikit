/** 时长与缓动 Atom；减少动效偏好将默认时长归零。 */
import { value } from '../../../value'
import { variable } from '../../../variable'
import { condition, media } from '../../../condition'
import { calcMultiply } from '../combiners/calc'

/** 完整动效的时长倍率，保留原时长。 */
export const fullMotion = value(1)

/** 减少动效的时长倍率，将时长缩至零。 */
export const reducedMotion = value(0)

/** 系统动效倍率；减少动效偏好默认将时长缩至零。 */
const motionScaleRatio = variable(fullMotion, {
  name: 'motion-scale-ratio',
  onActive: () => [
    [[condition(':where(:root)')], motionScaleRatio, fullMotion],
    [[condition(':where(:root)'), media('(prefers-reduced-motion: reduce)'), condition('&')], motionScaleRatio, reducedMotion],
  ],
})

/** 快速反馈的基础时长，单位为毫秒。 */
export const fastBase = value('120ms')

const durationFastDefault = calcMultiply(fastBase, motionScaleRatio)
/**
 * 可覆盖的快速过渡时长，默认在根上将 120ms 乘以动效倍率。
 * @example [$transition, transitionValue([$opacity, durationFast, easingStandard])] // 通常过渡 120ms；减少动效时为 0ms。
 */
export const durationFast = variable(durationFastDefault, {
  name: 'duration-fast',
  onActive: () => [[[condition(':where(:root)')], durationFast, durationFastDefault]],
})

/** 快速起步、逐渐收稳的缓动曲线。 */
export const standardCurve = value('cubic-bezier(0.2, 0, 0, 1)')

/** 可覆盖的标准缓动曲线。 */
export const easingStandard = variable(standardCurve, { name: 'easing-standard' })
