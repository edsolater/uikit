import { type ColorMaterial } from '@/color-system'
import { toJSSColor } from './ui-color-structure'

/** 默认品牌材料及对应的可声明颜色变量。 */

export const brand: ColorMaterial = {
  base: { lightness: 0.58, chroma: 0.2, hue: 260 },
  environmentSensitivities: {
    // 暂取 25%，让品牌色随亮暗环境变化，又保留 75% 自身与目标的明度差异，避免被漂白或压黑。
    lightness: 0.25,
    // 暂取 15%，使品牌彩度有适应空间，但仍以原有鲜明程度为主，避免品牌色被环境冲淡。
    chroma: 0.15,
    // 暂取 2%，允许轻微冷暖染色，同时保留品牌色相身份；单次色相最多偏移 3.6°。
    hue: 0.02,
  },
  purpose: 'content',
}
export const brandColor = toJSSColor(brand, 'brand-color')

