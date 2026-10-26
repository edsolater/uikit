/**
 * 原生控件外观的属性目标。
 *
 * 控制原生控件绘制方式与强调色；不混入任意交互行为。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $accentColor = key('accent-color')

export const $appearance = key('appearance')

/** 原生控件外观的 CSS 原名与具名 Key 对应表。 */
export const appearanceKeys = {
  'accent-color': $accentColor,
  'appearance': $appearance,
}
