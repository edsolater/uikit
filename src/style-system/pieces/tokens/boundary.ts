/** 边界厚度基准；焦点等具体部分按需要相对放大。 */
import { token } from '../../token'

export const buttonBorderWidth = token('1px', {
  name: 'boundary-width',
  address: ':where(:root)',
})
