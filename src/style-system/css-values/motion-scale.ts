/** 时长、动效倍率与缓动曲线。 */
import { value } from '../core/css-value'

/** 快速反馈的基础时长，单位为毫秒。 */
export const baseFastDuration = value('120ms')

/** 完整动效的时长倍率，保留原时长。 */
export const fullMotionScale = value(1)

/** 减少动效的时长倍率，将时长缩至零。 */
export const reducedMotionScale = value(0)

/** 快速起步、逐渐收稳的缓动曲线。 */
export const standardCurve = value('cubic-bezier(0.2, 0, 0, 1)')
