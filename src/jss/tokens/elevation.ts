/** 用共享阴影颜色派生不同高度的材料。 */
import { cssValueSequence } from '../core/css-value'
import { token } from './token'

const color = token('color-shadow', 'rgb(0 0 0 / 4%)', { dark: 'rgb(0 0 0 / 38%)' })
export const cssShadow = {
  flat: token('shadow-0', 'none'),
  low: token('shadow-1', cssValueSequence('0 1px 2px ', color)),
  raised: token('shadow-2', cssValueSequence('0 1px 2px rgb(0 0 0 / 3%), 0 6px 18px ', color)),
  high: token('shadow-3', cssValueSequence('0 2px 4px rgb(0 0 0 / 3.5%), 0 10px 24px ', color)),
}
