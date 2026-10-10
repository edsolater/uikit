/**
 * 纸色、墨色与中性色的基础材料及对应 Variable。
 *
 * 定义颜色的 JS 源头，并由共用转换入口创建基础颜色变量。
 *
 * 材料可继续参与颜色计算，Variable 供用途配方直接引用。
 */

import type { ColorMaterial } from '@/color-system'
import { toJSSColor } from './ui-color-structure'

// 各材料直接配置自身响应；下面说明每个比例的取舍意图，具体数值是人为配方，没有唯一的推导值。
// 百分比指单次接受多少目标差异，按环境 influence 为 1 理解；实际观感由色表检查与调整。

export const paper: ColorMaterial = {
  base: { lightness: 0.98, chroma: 0.003, hue: 260 },
  environmentSensitivities: {
    // 取 100%，让纸面完整到达自身的亮暗目标；较小比例会让暗纸面残留过多原来的白色。
    lightness: 1,
    // 暂取 25%，让纸面接受一部分环境彩度，同时以自身近中性色为主，避免纸面染色过重。
    chroma: 0.25,
    // 暂取 4%，让大面积纸面带出轻微冷暖；单次色相最多偏移 7.2°，不完全跟随环境色相。
    hue: 0.04,
  },
  // 亮环境接近白纸，暗环境保持接近黑色的深灰。
  environmentTargets: { lightness: (_base, environment) => 0.18 + 0.8 * environment.tint!.lightness! },
  purpose: 'surface',
}

export const ink: ColorMaterial = {
  base: { lightness: 0.15, chroma: 0.004, hue: 260 },
  environmentSensitivities: {
    // 取 100%，让墨色完整到达自身的深灰或浅色目标；暗环境下不能继续保留原来的深色文字。
    lightness: 1,
    // 暂取 18%，弱于纸面的彩度响应，让文字适应环境而少带颜色，保留灰色文字的辨识。
    chroma: 0.18,
    // 暂取 2%，低于纸面的冷暖响应，让文字稍随纸面偏色；单次色相最多偏移 3.6°。
    hue: 0.02,
  },
  // 亮环境用可辨识深灰，暗环境转为清晰浅色。
  environmentTargets: { lightness: (_base, environment) => 0.88 - 0.56 * environment.tint!.lightness! },
  purpose: 'content',
}

/** 独立中性材料；色值不绑定用途层级。 */
export const neutral: ColorMaterial = {
  base: { lightness: 0.58, chroma: 0.007, hue: 260 },
  environmentSensitivities: {
    // 暂取 40%，比品牌色更明显地适应背景明暗，同时保留 60% 自身与目标的差异，避免灰色完全消失在背景中。
    lightness: 0.4,
    // 暂取 25%，允许灰色带入少量环境彩度，但不把中性材料直接替换成环境色。
    chroma: 0.25,
    // 暂取 1%，让中性灰的冷暖变化弱于纸面与墨色；单次色相最多偏移 1.8°。
    hue: 0.01,
  },
  purpose: 'content',
}

export const paperColor = toJSSColor(paper, 'paper-color')
export const inkColor = toJSSColor(ink, 'ink-color')
export const neutralColor = toJSSColor(neutral, 'neutral-color')
