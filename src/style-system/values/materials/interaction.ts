/** 通用控件的指针、禁用反馈与按压位移。 */
import { variable } from '../../core/css-variable'
import { value } from '../../core/css-value'
import { whenActive, whenDisabled } from '../../selectors/msic'
import { translateY } from '../functions/transform'
import { disabledOpacity } from './opacity'
import { thinDistance } from './space'

/** 动作指针；禁用时统一显示不可操作。 */
export const actionCursor = variable('interaction-cursor', {
  fallback: value('pointer', [[whenDisabled, 'not-allowed']]),
})

/** 控件整体透明度；禁用时使用共享淡化程度。 */
export const interactionOpacity = variable('interaction-opacity', {
  fallback: value(1, [[whenDisabled, disabledOpacity]]),
})

/** 按下时轻微下移；禁用时保持原位。 */
export const pressTransform = variable('interaction-transform', {
  fallback: value('none', [[whenActive, translateY(thinDistance)], [whenDisabled, 'none']]),
})
