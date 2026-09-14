/** 以当前前景色形成的轻量交互底色。 */
import { foregroundColor } from './color-theme'
import { colorMix } from './color-mix'
import { mixWeights } from './opacity'

/** 悬停时的轻量覆盖层，保留较淡的前景色。 */
export const hoverOverlay = colorMix([foregroundColor, mixWeights.overlayHover], 'transparent')

/** 按下时的轻量覆盖层，比悬停更明显。 */
export const activeOverlay = colorMix([foregroundColor, mixWeights.overlayActive], 'transparent')
