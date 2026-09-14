/** 以当前前景色形成的轻量交互底色。 */
import { colors } from '../css-variables/color'
import { colorMix } from './color-mix'
import { mixWeights } from './opacity'

/** 裸底交互的轻量底色：悬停较淡，按下更明显。 */
export const overlays = {
  hover: colorMix([colors.fg, mixWeights.overlayHover], 'transparent'),
  active: colorMix([colors.fg, mixWeights.overlayActive], 'transparent'),
}
