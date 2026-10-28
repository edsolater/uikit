/** 圆角基准及相对尺寸状态；具体组件的固定外形由组件定义。 */
import { token } from '../../token'
import { multiply } from '../functions/calc'
import { whenSmall, whenLarge, whenXlarge } from '../conditions/profile'

export const baseRadius = token('4px', {
  name: 'base-radius',
  address: ':where(:root)',
  state: [
    [whenSmall, (base) => multiply(base, 1 / 2)],
    [whenLarge, (base) => multiply(base, 2)],
    [whenXlarge, (base) => multiply(base, 3)],
  ],
})
