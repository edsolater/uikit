/** 独立于普通空间长度的圆角尺度及覆盖入口。 */
import { value } from '../../core/css-value'
import { variable } from '../../core/css-variable'

/** 小圆角半径的固定 Value，与普通空间长度独立调整。 */
export const smallRadius = value('4px')

/** 胶囊圆角半径的固定 Value。 */
export const pillRadius = value('999px')

/** 组件级圆角 Variable，未局部重定义时读取小圆角固定值。 */
export const cornerRadius = variable('component-radius', { fallback: smallRadius })
