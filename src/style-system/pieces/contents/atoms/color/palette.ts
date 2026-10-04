/**
 * 基础颜色、中性材料与亮暗环境。
 *
 * 同一环境需要同时照顾纸面和文字。
 */

import type { ColorEnvironment, ColorMaterial } from '../../../../../color-system/core'

// 保留中性材料自身色值；当前只响应冷暖，亮暗目标尚未定义。
export const paper: ColorMaterial = {
  base: { lightness: 0.98, chroma: 0.003, hue: 260 },
  environmentSensitivities: { hue: 1 },
  purpose: 'surface',
}

export const ink: ColorMaterial = {
  base: { lightness: 0.15, chroma: 0.004, hue: 260 },
  environmentSensitivities: { hue: 1 },
  purpose: 'content',
}

/** 中性材料取原色阶中段；色值不绑定用途层级。 */
export const neutral: ColorMaterial = {
  base: { lightness: 0.58, chroma: 0.007, hue: 260 },
  environmentSensitivities: { hue: 1 },
  purpose: 'content',
}

// 冷暖角度和染色强度是可调配方，尚未按实际界面校准。

// 亮环境略偏暖；省略明度与色度影响，保留亮色基底。
export const lightTheme: ColorEnvironment = {
  tint: {
    // 60 偏橙黄，选作暖色方向。
    hue: 60
  },
  influence: {
    // 沿最短色相距离只走 2%（最多 3.6°），用于轻微染色。
    hue: 0.02
  },
}

// 暗环境，略偏冷。
export const darkTheme: ColorEnvironment = {
  tint: {
    // 250 偏蓝，选作冷色方向。
    hue: 250
  },
  influence: {
    // 明度环境作用强度；没有明度目标时不产生变化。
    lightness: 1,
    // 彩度环境作用强度；没有彩度目标时不产生变化。
    chroma: 1,
    // 沿最短色相距离只走 2%（最多 3.6°），用于轻微染色。
    hue: 0.02
  },
}
