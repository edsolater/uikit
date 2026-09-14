/** 透明度与混色配比；数值均为零至一的比例。 */
import { value } from '../core/css-value'

/** 不可用状态的淡化程度，取零至一的透明度比例。 */
export const disabledOpacity = value(0.48)

/** 混色中指定颜色的占比；边框取线色比例，语气底色取表面色比例。 */
export const mixWeights = {
  border: 0.72,
  overlayHover: 0.08,
  overlayActive: 0.14,
  surface: 0.76,
  surfaceHover: 0.66,
  surfaceActive: 0.56,
}
