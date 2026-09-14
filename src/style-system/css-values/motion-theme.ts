/** 随减少动效偏好缩放的时长和共享缓动。 */
import { variable } from '../core/css-variable'
import { joinValues } from '../core/css-value'
import { baseFastDuration, fullMotionScale, reducedMotionScale, standardCurve } from './motion-scale'

/** 系统动效倍率；减少动效偏好默认将时长缩至零。 */
const scale = variable('sys-motion-scale', { root: { value: fullMotionScale, reducedMotion: reducedMotionScale } })

/** 可覆盖的快速过渡时长，受减少动效偏好控制。 */
export const fastDuration = variable('motion-duration-fast', {
  root: {
    value: joinValues('', 'calc(', baseFastDuration, ' * ', scale, ')'),
  },
})

/** 可覆盖的标准缓动曲线。 */
export const standardEasing = variable('motion-ease-standard', { root: { value: standardCurve } })
