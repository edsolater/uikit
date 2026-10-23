/** 动效时长与缓动基准；快慢用相对倍率表达，减少动效由环境状态处理。 */
import { variable } from '../../../variable'
import { multiply } from '../functions/calc'

export const motionDuration = variable('180ms', {
  name: 'motion-duration',
  states: {
    '@media (prefers-reduced-motion: reduce)': base => multiply(base, 0),
  },
})

export const motionEasing = variable('cubic-bezier(0.2, 0, 0, 1)', 'motion-easing')
