/** 从用户减少动效偏好派生时长，并提供共享缓动。 */
import { cssValueSequence } from '../core/css-value'
import { token } from './token'

const scale = token('sys-motion-scale', 1, { reducedMotion: 0 })
export const cssMotion = {
  fast: token('motion-duration-fast', cssValueSequence('calc(120ms * ', scale, ')')),
  standard: token('motion-ease-standard', 'cubic-bezier(0.2, 0, 0, 1)'),
}
