import type { ButtonAppearance } from "./Button";

/** 原始外观省略时，DOM 默认采用 outlined；可在组件生成前调整转换表。 */
export const buttonDefaultPropSettings = {
  appearance: { undefined: 'outlined' satisfies ButtonAppearance },
} 
