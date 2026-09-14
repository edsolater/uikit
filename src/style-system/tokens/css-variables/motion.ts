/** 随减少动效偏好缩放的时长和共享缓动。 */
import { joinValues } from '../../core/css-value'
import { durations, motionScales, easings } from '../values/motion'
import { token } from '../token'

/** 系统动效倍率；减少动效偏好默认将时长缩至零。 */
const scale = token('sys-motion-scale', motionScales.full, { reducedMotion: motionScales.reduced })

/** 可覆盖的快速过渡时长与缓动曲线；时长受系统动效倍率控制。 */
export const motion = {
  fast: token('motion-duration-fast', joinValues('', 'calc(', durations.fast, ' * ', scale, ')')),
  standard: token('motion-ease-standard', easings.standard),
}
