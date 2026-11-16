/**
 * Label 的输入、字段协议与实例控制声明。
 *
 * 聚合字段关联、可见标题与辅助说明。
 *
 * 渲染行为由同名组件实现，样式仍归所属样式文件。
 */
import type { Source } from '@/foundation'
import type { PivProps } from '../../Piv/Piv'
import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
} from '../../tools/kit'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Label'

/** Label 的公共输入与自有信息；引用接收器由 Kit 统一提供。 */
export type LabelProps = Omit<
  KitProps<{ controller: LabelController; domTag: 'span' }>,
  'children'
> & {
  for?: Source<string | undefined>
  children: Source<string>
  tooltip?: PivProps['children']
  /** 替换默认问号的显示内容，不嵌入另一个交互控件。 */
  tooltipTrigger?: PivProps['children']
}

/** 自有输入的读取方式；公共字段沿用 Kit 协议。 */
const labelOwnPropDefinition = {
  for: 'state-source-view',
  children: 'state-source-view',
  tooltip: 'state-source-view',
  tooltipTrigger: 'state-source-view',
} as const

/** 自有读取模式与公共协议共同组成完整字段契约。 */
export type LabelPropDefinition = KitPropDefinition<
  typeof labelOwnPropDefinition
>

/** 与类型契约对应的完整运行时字段定义。 */
export const labelPropDefinition: LabelPropDefinition = {
  ...kitPropDefinition,
  ...labelOwnPropDefinition,
}

/** 控制字段关联、标题来源与辅助说明。 */
export interface LabelController extends KitController<{
  props: LabelProps
  propDefinition: LabelPropDefinition
}> {}
