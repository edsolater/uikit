/** 时长、动效倍率与缓动曲线。 */
import { value } from '../../core/css-value'

/** 快速反馈的固定时长，单位为毫秒。 */
export const durations = { fast: value('120ms') }

/** 完整与减少动效的时长倍率。 */
export const motionScales = { full: value(1), reduced: value(0) }

/** 快速起步、逐渐收稳的过渡曲线。 */
export const easings = { standard: value('cubic-bezier(0.2, 0, 0, 1)') }
