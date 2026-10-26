/**
 * 矢量渲染取舍的属性目标。
 *
 * 提示图形及文字绘制时在速度、清晰度、精度之间采用哪种策略。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $shapeRendering = key('shape-rendering')

export const $textRendering = key('text-rendering')

/** 矢量渲染取舍的 CSS 原名与具名 Key 对应表。 */
export const svgRenderingKeys = {
  'shape-rendering': $shapeRendering,
  'text-rendering': $textRendering,
}
