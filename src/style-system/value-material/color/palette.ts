/** 原始色阶的 Variable Cluster；颜色定义由基础 CSS 提供，查询不创建变量。 */
import { variable, type Variable } from '../../core/css-variable'

/** 预定义色阶引用；下标就是等级，底层名称不暴露给调用方。 */
const palette = {
  neutral: [
    variable('dye-neutral-0'),
    variable('dye-neutral-1'),
    variable('dye-neutral-2'),
    variable('dye-neutral-3'),
    variable('dye-neutral-4'),
    variable('dye-neutral-5'),
    variable('dye-neutral-6'),
    variable('dye-neutral-7'),
    variable('dye-neutral-8'),
  ],
}

/** 取已有色阶 Variable；neutral 支持 0–8，等级越高越接近当前主题墨色，缺省为 0；未定义项报错。 */
export function paletteColor(colorLabel: keyof typeof palette, level = 0): Variable {
  const color = Number.isInteger(level) ? palette[colorLabel]?.[level] : undefined
  if (!color) throw new Error(`未定义的色阶：${colorLabel}-${level}`)
  return color
}

/** 品牌身份色；与原始色阶分开，沿用基础 CSS 的品牌覆盖入口。 */
export const brand = variable('color-brand')
