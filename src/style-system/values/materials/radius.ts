/** 独立于普通空间长度的圆角尺度及覆盖入口。 */
import { value } from '../../core/css-value'
import { variable } from '../../core/css-variable'

/** 小圆角半径，与普通空间长度独立调整。 */
export const smallRadius = value('4px')

/** 胶囊圆角半径。 */
export const pillRadius = value('999px')

/** 圆角半径，未覆盖时采用小圆角。 */
export const cornerRadius = variable('component-radius', { fallback: smallRadius })
