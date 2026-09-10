/** 将基础 CSS 属性和值组合成可复用的 Block。 */
import { cssBlock, type CssBlock } from '../core/css-block'

/** 组合四个方向的外边距，值为单个长度、百分比或 auto。 */
export function margin(v: CssBlock): CssBlock {
  return cssBlock().attach(marginTop(v), marginRight(v), marginBottom(v), marginLeft(v))
}

/** 构造上外边距。 */
export function marginTop(v: CssBlock): CssBlock {
  return cssBlock(() => `margin-top: ${v};`, { dependence: [v] })
}

/** 构造右外边距。 */
export function marginRight(v: CssBlock): CssBlock {
  return cssBlock(() => `margin-right: ${v};`, { dependence: [v] })
}

/** 构造下外边距。 */
export function marginBottom(v: CssBlock): CssBlock {
  return cssBlock(() => `margin-bottom: ${v};`, { dependence: [v] })
}

/** 构造左外边距。 */
export function marginLeft(v: CssBlock): CssBlock {
  return cssBlock(() => `margin-left: ${v};`, { dependence: [v] })
}

/** 构造盒阴影。 */
export function boxShadow(v: CssBlock): CssBlock {
  return cssBlock(() => `box-shadow: ${v};`, { dependence: [v] })
}
