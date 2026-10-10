/** 亮、暗颜色环境。
 *
 * 提供明度、彩度和冷暖目标，交给 Color System 按材料感知求值。
 *
 * 环境描述外部目标；保留多少自身颜色由材料决定。
 */
import type { ColorEnvironment } from '@/color-system'

// 人为默认环境，尚未视觉校准；中性彩度目标减轻饱和度，不表达完整主题反转。

export const lightTheme: ColorEnvironment = {
  tint: { lightness: 1, chroma: 0, hue: 60 },
}

export const darkTheme: ColorEnvironment = {
  tint: { lightness: 0, chroma: 0, hue: 250 },
}
