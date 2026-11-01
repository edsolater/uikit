/**
 * 这个文件定义基础按钮组件 Button。
 * Button 承载当前界面里的一个可执行动作，适合保存、确认、取消、清除、删除这类命令。
 * 会改变位置的交互应使用 Link；业务流程判断、表单编排和状态来源不塞进 Button 本体。
 * Button 只把动作内容、外观、强调程度、动作语气、按钮尺寸和外部状态翻译成原生 button。
 *
 * 组件选择规则见 [Button 设计规格](./Button.spec.md)。
 * 稳定语义见 [Button 基础组件 Guide](../../../../docs/guide/Button基础组件.md)。
 */
import type { Source } from '@/foundation'
import type { PropsController } from '@/components/utils/componentPropsDirector'
import type { RefReceiver } from '@/hooks/createRef'
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'
import { kit } from '@/components/utils/kit'
import { clickable } from '../../plugins/kits/clickable/clickable'
import { Piv, type PivProps } from '../../Piv/Piv'
import type { EventListenerInput } from '../../Piv/on/handleOn'
import {
  createVariantPropsParser,
  type VariantProps,
} from '../utils/parseVariantProps'
import {
  createStatusPropsParser,
  type StatusProps,
} from '../utils/parseStatusProps'
import {
  buttonPropsDefinition,
  buttonStatusCandidates,
  buttonVariantGroups,
  getButtonPropsDirectorOptions,
} from './Button.prop'
import { buttonMapping } from './Button.mapping'
import * as buttonStyle from './Button.style'

/**
 * 按钮的外观 Variant Props。
 *
 * - filled、outlined、plain：填充、轮廓、无边界形式，由 Button 样式消费。
 * - undefined：未指定外观。
 *
 * 外观确定时优先声明 filled、outlined 或 plain；动态选择使用 appearance。
 * appearance 一旦声明便接管整个外观分组，undefined 不回落到确定描述词。
 */
export type ButtonAppearance = 'filled' | 'outlined' | 'plain'

/**
 * 强调程度独立于外观和语气：soft 降低整体存在感，strong 提高，省略保持普通程度。
 * soft/strong 是确定描述词，emphasis 用于动态选择。
 */
export type ButtonEmphasis = 'soft' | 'strong'

/**
 * 按钮的动作语气 Variant Props。
 *
 * - danger：破坏性动作。
 * - undefined：普通语气。
 *
 * 破坏性动作声明 danger；动态选择使用 tone。
 * tone 一旦声明便接管整个动作语气分组，即使当前值是 undefined 也不会回落到确定描述词。
 */
export type ButtonTone = 'danger'

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
export type ButtonSize = 'small' | 'large' | 'xlarge'

/**
 * 按钮可以同时处于 loading 和 disabled 状态。
 * 声明阶段使用 Props；启用组件 ref 后，特殊运行场景可通过同一字段 State 改变。
 */
export type ButtonStatus = 'loading' | 'disabled'

/** 一个 Button 实例公开的状态操作；原生元素通过独立的 domRef 取得。 */
export type ButtonController = PropsController<
  ButtonProps,
  typeof buttonPropsDefinition
>

export interface ButtonProps
  extends
    PivProps<'button'>,
    ComponentDescriptionProps,
    VariantProps<'appearance', ButtonAppearance>,
    VariantProps<'emphasis', ButtonEmphasis>,
    VariantProps<'tone', ButtonTone>,
    VariantProps<'size', ButtonSize>,
    StatusProps<ButtonStatus> {
  /** 接收此实例的 Controller，可返回组件销毁时的清理动作。 */
  ref?: RefReceiver<ButtonController>
  /**
   * 动作名。
   *
   * name 描述“这个按钮动作是什么”，用于可访问性、调试和纯图形按钮的动作识别。
   * 这个字段站在界面动作语义上，不兼容原生表单 name 语义。
   * 它不替代 children，也不表示可见文案；普通文本按钮应优先把可见内容写进 children。
   * 当 children 只有图标或其他非文本内容时，用 name 提供 aria-label。
   * 原生 button 的 name attribute 通过 htmlProps.name 传入，不使用这个字段。
   */
  name?: Source<string | undefined>

  /** 用户执行这个按钮动作时触发。Button 在内部把它翻译成 Piv 的 click 事件声明。 */
  onClick?: EventListenerInput<'click'>
}

const parseVariantProps = createVariantPropsParser(
  buttonVariantGroups,
  buttonMapping,
)

const parseStatusProps = createStatusPropsParser({
  candidates: [...buttonStatusCandidates],
  effect: ({ loading, disabled }) => ({
    htmlProps: {
      disabled,
      'aria-busy': loading,
    },
  }),
})

/** 共同机制由 kit 管理，Button 本体只表达分类、状态与动作。 */
export const Button = kit(
  {
    name: 'Button',
    description: '执行动作',
    availableProps: buttonPropsDefinition,
    directorOptions: getButtonPropsDirectorOptions,
    styleTokens: buttonStyle,
  },
  (props: ButtonProps, context) => {
    const { effect: variantEffectProps } = parseVariantProps(props)
    const { effect: statusEffectProps } = parseStatusProps(props)

    return (
      <Piv
        as="button"
        shadowProps={[props, ...variantEffectProps, ...statusEffectProps]}
        class="Button"
        plugins={[clickable({ componentName: context.name })]}
        htmlProps={{
          'aria-label': props.name,
        }}
        on={{ click: props.onClick }}
      >
        {props.children}
      </Piv>
    )
  },
)
