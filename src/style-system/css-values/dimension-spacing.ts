/** 可由各组件在自身规则内定义的尺寸与间距。 */
import { variable } from '../core/css-variable'
import { normalSize, normalSpace, xlargeSpace } from './dimension-theme'

/** 控件最小高度，默认采用普通尺寸档。 */
export const minimumHeight = variable('component-min-height', { fallback: normalSize })

/** 横向内边距，默认采用加大间距档。 */
export const horizontalPadding = variable('component-padding-x', { fallback: xlargeSpace })

/** 纵向内边距，默认采用普通间距档。 */
export const verticalPadding = variable('component-padding-y', { fallback: normalSpace })

/** 内容间隔，与四周内边距分开控制。 */
export const contentGap = variable('component-gap', { fallback: normalSpace })
