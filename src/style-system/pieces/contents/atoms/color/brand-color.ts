import type { ColorMaterial } from '../../../../../color-system/core';
import { hue, chroma, lightness } from '../../../../../color-system/tools/channels';

/** 默认品牌材料，取当前 CSS 的品牌基色。 */

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
};
/** 交互色直接沿用品牌材料及其感知配置。
 * 明度 0.25 保留品牌的亮暗适应，彩度 0.15 保留品牌的鲜明程度，色相 0.02 保留品牌身份。
 * 交互用途本身不构成另一套环境响应的理由，因此不另设比例。
 */

export const interactive: ColorMaterial = brand;
/** 高亮色改变品牌基色，保留品牌的感知配置。
 * 明度 0.25 让高亮色适应亮暗而不完全趋向背景，彩度 0.15 避免派生色被环境冲淡，色相 0.02 保留派生色身份。
 * 高亮差异由下面的基色变换表达，因此不再通过另一套感知比例重复加强。
 */

export const highlight: ColorMaterial = hue(
  chroma(
    lightness(brand, (value) => value + 0.04),
    (value) => value + 0.01
  ),
  (value) => value - 18
);
