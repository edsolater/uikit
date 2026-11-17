/**
 * Button 的公共输入、候选与实例控制声明。
 *
 * 在同一处声明分类与状态事实，并组合完整字段协议。
 *
 * 动作执行与状态能力由同名组件实现，样式配置由样式文件拥有。
 */
import {
  kitPropDefinition,
  type KitController,
  type KitPropDefinition,
  type KitProps,
} from '../../tools/kit'
import type { EventListenerInput } from '../../Piv/on/event-declarations'
import type { VariantProps } from '../utils/parseVariantProps'
import type { StatusProps, StatusController } from '../utils/parseStatusProps'
import type { ButtonStyleConfig } from './Button.style'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Button'

/** 按钮可独立组合的外观、强调、语气和尺寸候选。 */
export const buttonVariantGroups = [
  { groupName: 'appearance', candidates: ['filled', 'outlined', 'plain'] },
  { groupName: 'emphasis', candidates: ['soft', 'strong'] },
  { groupName: 'tone', candidates: ['danger'] },
  { groupName: 'size', candidates: ['small', 'large', 'xlarge'] },
] as const

/**
 * 按钮的外观 Variant Props。
 *
 * - filled、outlined、plain：填充、轮廓、无边界形式，由 Button 样式消费。
 * - undefined：未指定外观。
 *
 * 外观确定时优先声明 filled、outlined 或 plain；动态选择使用 appearance。
 * appearance 一旦声明便接管整个外观分组，undefined 不回落到确定描述词。
 */
export type ButtonAppearance = Extract<
  (typeof buttonVariantGroups)[number],
  { groupName: 'appearance' }
>['candidates'][number]

/**
 * 强调程度独立于外观和语气：soft 降低整体存在感，strong 提高，省略保持普通程度。
 * soft/strong 是确定描述词，emphasis 用于动态选择。
 */
export type ButtonEmphasis = Extract<
  (typeof buttonVariantGroups)[number],
  { groupName: 'emphasis' }
>['candidates'][number]

/**
 * 按钮的动作语气 Variant Props。
 *
 * - danger：破坏性动作。
 * - undefined：普通语气。
 *
 * 破坏性动作声明 danger；动态选择使用 tone。
 * tone 一旦声明便接管整个动作语气分组，即使当前值是 undefined 也不会回落到确定描述词。
 */
export type ButtonTone = Extract<
  (typeof buttonVariantGroups)[number],
  { groupName: 'tone' }
>['candidates'][number]

/**
 * 按钮的物理尺寸 Variant Props。
 *
 * - small：紧凑，适用于工具栏或空间受限的场景。
 * - large：需要更宽松尺度或更大命中面积。
 * - xlarge：需要更大的命中面积。
 * - undefined：默认尺度，适用于大多数场景。
 *
 * 尺寸确定时优先声明 small、large 或 xlarge；只有尺寸会在多个 Variant 之间变化时才使用 size。
 * size 一旦声明便接管整个尺寸分组，即使当前值是 undefined 也不会回落到确定描述词。
 */
export type ButtonSize = Extract<
  (typeof buttonVariantGroups)[number],
  { groupName: 'size' }
>['candidates'][number]

/** 按钮可同时激活的状态候选。 */
export const buttonStatusCandidates = ['loading', 'disabled'] as const

/**
 * 按钮可以同时处于 loading 和 disabled 状态。
 * 输入通过 Props 声明；运行期可通过 Controller.props 干预输入，或使用顶层组件状态操作。
 */
export type ButtonStatus = (typeof buttonStatusCandidates)[number]

/** 动作内容、外观分类和状态输入，原生节点声明沿用 Piv 契约。 */
export type ButtonProps = KitProps<{
  $styleConfig: ButtonStyleConfig
  controller: ButtonController
  domTag: 'button'
}> &
  VariantProps<'appearance', ButtonAppearance> &
  VariantProps<'emphasis', ButtonEmphasis> &
  VariantProps<'tone', ButtonTone> &
  VariantProps<'size', ButtonSize> &
  StatusProps<ButtonStatus> & {
    /** 用户执行这个按钮动作时触发。Button 在内部把它翻译成 Piv 的 click 事件声明。 */
    onClick?: EventListenerInput<'click'>
  }

/** Source 交原消费者读取；普通值跟踪读取；原创建字段取消跟踪但不缓存。 */
const buttonOwnPropDefinition = {
  appearance: 'state-source-view',
  filled: 'state-source-view',
  outlined: 'state-source-view',
  plain: 'state-source-view',
  emphasis: 'state-source-view',
  soft: 'state-source-view',
  strong: 'state-source-view',
  tone: 'state-source-view',
  danger: 'state-source-view',
  size: 'state-source-view',
  small: 'state-source-view',
  large: 'state-source-view',
  xlarge: 'state-source-view',
  loading: 'state-source-view',
  disabled: 'state-source-view',
  onClick: 'state-value-view',
} as const

/** 自有事实只定义一次，完整模式由通用协议与自有模式组合。 */
export type ButtonPropDefinition = KitPropDefinition<
  typeof buttonOwnPropDefinition
>

/** 完整运行时字段定义与声明类型一一对应。 */
export const buttonPropDefinition: ButtonPropDefinition = {
  ...kitPropDefinition,
  ...buttonOwnPropDefinition,
}

/** 顶层状态能力与按字段协议构造的输入控制共同组成按钮协议。 */
export interface ButtonController
  extends
    KitController<{ props: ButtonProps; propDefinition: ButtonPropDefinition }>,
    StatusController<ButtonStatus> {}
