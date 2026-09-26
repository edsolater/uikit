/** 排列方式与对齐 JSSKey。 */
import { key } from '../../key'

// =============================================================================
// 容器排列内部内容
// =============================================================================

/** display Key，选择元素的内部布局类型及外部显示角色。 */
export const $display = key('display')

/** flex-direction Key，选择 Flex 主轴方向。 */
export const $flexDirection = key('flex-direction')

/** flex-wrap Key，选择 Flex 子项是否换行。 */
export const $flexWrap = key('flex-wrap')

/** flex-flow Key，同时表达 Flex 主轴方向与换行方式。 */
export const $flexFlow = key('flex-flow')

/** grid-auto-flow Key，选择未定位 Grid 子项的自动排布方向。 */
export const $gridAutoFlow = key('grid-auto-flow')

/** justify-content Key，控制整组内容沿行轴的分布。 */
export const $justifyContent = key('justify-content')

/** align-content Key，控制整组内容沿块轴的分布。 */
export const $alignContent = key('align-content')

/** place-content Key，同时控制整组内容在行轴与块轴上的分布。 */
export const $placeContent = key('place-content')

/** align-items Key，控制容器内子项沿块轴的对齐。 */
export const $alignItems = key('align-items')

/** place-items Key，同时控制容器内子项在行轴与块轴上的对齐。 */
export const $placeItems = key('place-items')

/** gap Key，设置子项之间的间距。 */
export const $gap = key('gap')

// =============================================================================
// 子项参与外部布局
// =============================================================================

/** align-self Key，为当前子项覆盖父容器的块轴对齐。 */
export const $alignSelf = key('align-self')
