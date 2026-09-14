/** 可由各组件在自身规则内定义的尺寸与间距。 */
import { variable } from '../../core/css-variable'
import { size, space } from './dimension'

/** 控件最小高度，默认采用普通尺寸档。 */
export const minHeight = variable('component-min-height', { fallback: size.normal })

/** 横向内边距，默认采用加大间距档。 */
export const paddingX = variable('component-padding-x', { fallback: space.xlarge })

/** 纵向内边距，默认采用普通间距档。 */
export const paddingY = variable('component-padding-y', { fallback: space.normal })

/** 内容间隔，与四周内边距分开控制。 */
export const gap = variable('component-gap', { fallback: space.normal })
