/** 通用控件的指针、禁用反馈与按压位移。 */
import { variable } from '../../core/css-variable'
import { value } from '../../core/css-value'
import { whenActive, whenDisabled } from '../../selectors/msic'
import { $translateY } from '../functions/transform'
import { disabledFade } from './opacity'

/** 按压反馈的垂直位移；它与同为一像素的边缘厚度是不同服务对象。 */
const pressOffset = variable('interaction-press-offset', { root: { value: '1px' } })

/** 指针 Variable；禁用时统一显示不可操作。 */
export const cursor = variable('interaction-cursor', {
  fallback: value('pointer', [[whenDisabled, 'not-allowed']]),
})

/** 透明度 Variable；禁用时使用共享淡化程度。 */
export const opacity = variable('interaction-opacity', {
  fallback: value(1, [[whenDisabled, disabledFade]]),
})

/** 按下时轻微下移；禁用时保持原位。 */
export const pressFeedback = variable('interaction-press-transform', {
  fallback: value('none', [[whenActive, $translateY(pressOffset)], [whenDisabled, 'none']]),
})
