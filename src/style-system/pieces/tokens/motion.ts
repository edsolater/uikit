/** 动效时长与缓动基准；快慢用相对倍率表达，减少动效由环境状态处理。 */
import { token } from '../../token'
import { multiply } from '../functions/calc'
import { whenReducedMotion } from '../conditions/environment'

export const motionDuration = token('180ms', {
  name: 'motion-duration',
  address: ':root',
  state: [[whenReducedMotion, (base) => multiply(base, 0)]],
})

export const motionEasing = token('cubic-bezier(0.2, 0, 0, 1)', {
  name: 'motion-easing',
  address: ':root',
})
