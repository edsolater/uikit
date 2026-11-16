/**
 * SelectInput 的输入、字段协议与实例控制声明。
 *
 * 组合公共原生声明与本组件业务输入，明确动态来源的消费方式。
 *
 * 让公开契约独立于渲染实现，相关字段和控制声明在同一处维护。
 */
import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
} from '../../tools/kit'
import type { Source } from '@/foundation'
import type { TooltipOptions } from '../../plugins/kits/tooltip/tooltip'
/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'SelectInput'

/** 候选项以 value 标识选择，label 和 detail 分别呈现主名称与补充内容。 */
export type SelectInputOption = {
  value: string
  label: string
  detail?: string
}
/** 已选值的补充标签及对应说明内容。 */
export type SelectInputTag = {
  label: string
  /** 标签的补充说明，可以是结构化内容。 */
  tooltip: TooltipOptions['content']
}

/** SelectInput 的公共声明与自有业务输入。 */
export type SelectInputProps = KitProps<{}, SelectInputController, 'div'> & {
  value: Source<string>
  options: Source<SelectInputOption[]>
  /** 已选值的附加说明，最多显示前三项。 */
  tags?: Source<SelectInputTag[] | undefined>
  message?: Source<string | undefined>
  onQuery: (query: string) => void
  onSelect: (option: SelectInputOption) => void
  onClose?: () => void
}

/** 自有字段按实际消费者选择来源视图或当前值视图。 */
const selectInputOwnPropDefinition = {
  value: 'state-source-view',
  options: 'state-source-view',
  tags: 'state-source-view',
  message: 'state-source-view',
  onQuery: 'only-through-prop',
  onSelect: 'only-through-prop',
  onClose: 'only-through-prop',
} as const

/** 自有读取方式与完整公共协议共同组成字段声明。 */
export type SelectInputPropDefinition = KitPropDefinition<
  typeof selectInputOwnPropDefinition
>

/** SelectInput 的完整运行时字段协议。 */
export const selectInputPropDefinition: SelectInputPropDefinition = {
  ...kitPropDefinition,
  ...selectInputOwnPropDefinition,
}

/** SelectInput 的输入干预入口。 */
export interface SelectInputController extends KitController<
  SelectInputProps,
  SelectInputPropDefinition
> {}
