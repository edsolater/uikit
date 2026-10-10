import type { ColorMaterial } from '@/color-system'
import { variableCluster } from '@/style-system/variable-cluster'
import { paperColor } from './palette'
import { toJSSColor, readableContent, baseUIColorStructure } from './ui-color-structure'

/** 跨品牌稳定的状态材料；不在 CSS token 中保存颜色来源。 */

export const good: ColorMaterial = {
  base: { lightness: 0.62, chroma: 0.16, hue: 145 },
  environmentSensitivities: {
    // 暂取 20%，比品牌色少接受明暗变化，以绿色自身的状态辨识为主，同时仍随背景变亮或变深。
    lightness: 0.2,
    // 暂取 12%，弱于品牌色的彩度响应，减少环境对成功绿鲜明程度的改变。
    chroma: 0.12,
    // 暂取 1%，仅允许很轻的冷暖变化，避免成功绿偏向其他色族；单次色相最多偏移 1.8°。
    hue: 0.01,
  },
  purpose: 'content',
}
// 原错误红 #c42b1c 转为同色 OKLCH，保留数值精度。

export const bad: ColorMaterial = {
  base: { lightness: 0.53, chroma: 0.19, hue: 30.07 },
  environmentSensitivities: {
    // 暂取 18%，比成功绿更少接受明暗变化，以保留错误红的状态辨识，不让亮暗环境过度改写它。
    lightness: 0.18,
    // 暂取 10%，只接受较少的彩度变化，避免错误红被明显冲淡。
    chroma: 0.1,
    // 暂取 1%，把错误红的冷暖偏移限制得很小，保留红色身份；单次色相最多偏移 1.8°。
    hue: 0.01,
  },
  purpose: 'content',
}

export const warn: ColorMaterial = {
  base: { lightness: 0.72, chroma: 0.17, hue: 78 },
  environmentSensitivities: {
    // 暂取 15%，警告黄自身明度较高，少接受向亮环境的牵引，避免进一步漂白，同时仍响应暗环境。
    lightness: 0.15,
    // 暂取 8%，在状态材料中较少接受彩度变化，保留黄色的鲜明程度，避免趋向灰白。
    chroma: 0.08,
    // 暂取 1.5%，允许轻微冷暖偏移而保留黄橙色身份；单次色相最多偏移 2.7°。
    hue: 0.015,
  },
  purpose: 'content',
}

export const info: ColorMaterial = {
  base: { lightness: 0.62, chroma: 0.16, hue: 235 },
  environmentSensitivities: {
    // 暂取 22%，比成功绿与错误红多接受一点明暗变化，但弱于品牌色，兼顾背景适应与信息蓝的辨识。
    lightness: 0.22,
    // 暂取 12%，与成功绿采用同等幅度，允许彩度适应而不明显冲淡信息色。
    chroma: 0.12,
    // 暂取 1.5%，冷暖响应略强于成功绿与错误红、弱于品牌色，保留信息蓝身份；单次色相最多偏移 2.7°。
    hue: 0.015,
  },
  purpose: 'content',
}


// ------------ ui使用
export const goodColor = toJSSColor(good, 'good-color')
export const goodColors = variableCluster(
  baseUIColorStructure({
    base: goodColor,
    content: readableContent(goodColor),
  }),
)

export const badColor = toJSSColor(bad, 'bad-color')
export const badColors = variableCluster(
  baseUIColorStructure({
    base: badColor,
    content: paperColor,
  }),
)

export const warnColor = toJSSColor(warn, 'warn-color')
export const warnColors = variableCluster(
  baseUIColorStructure({
    base: warnColor,
    content: readableContent(warnColor),
  }),
)

export const infoColor = toJSSColor(info, 'info-color')
export const infoColors = variableCluster(
  baseUIColorStructure({
    base: infoColor,
    content: readableContent(infoColor),
  }),
)
