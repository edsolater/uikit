/**
 * Details 的输入、字段协议与实例控制声明。
 *
 * 聚合摘要、展开来源与原生 details 的实例能力。
 *
 * 组件保留原生展开行为，正文布局由调用方组合的基础组件拥有。
 */
import type { Source, JSX } from '@/foundation'
import type { PivProps } from '../../Piv/Piv'
import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
} from '../../tools/kit'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Details'

/** Details 的公共输入与自有信息；引用接收器由 Kit 统一提供。 */
export type DetailsProps = KitProps<{
  controller: DetailsController
  domTag: 'details'
}> & {
  summary: PivProps['children']
  open?: Source<boolean | undefined>
  children?: JSX.Element
  onToggle?: (open: boolean) => void
}

/** 自有输入的读取方式；公共字段沿用 Kit 协议。 */
const detailsOwnPropDefinition = {
  summary: 'state-value-view',
  open: 'state-source-view',
  children: 'state-value-view',
  domRef: 'only-through-prop',
  onToggle: 'state-value-view',
} as const

/** 自有读取模式与公共协议共同组成完整字段契约。 */
export type DetailsPropDefinition = KitPropDefinition<
  typeof detailsOwnPropDefinition
>

/** 与类型契约对应的完整运行时字段定义。 */
export const detailsPropDefinition: DetailsPropDefinition = {
  ...kitPropDefinition,
  ...detailsOwnPropDefinition,
}

/** 控制摘要和展开输入，并保留原生节点能力。 */
export interface DetailsController extends KitController<{
  props: DetailsProps
  propDefinition: DetailsPropDefinition
}> {}
