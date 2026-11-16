/**
 * Button 是执行单个界面动作的基础按钮。
 *
 * 呈现动作内容、外观、强调程度、语气、尺寸与外部状态，并保留原生按钮行为。
 *
 * 让动作触发与业务流程、表单编排和状态来源分开；导航交给 Link。
 *
 * 组件选择规则见 [Button 设计规格](./Button.spec.md)。
 * 稳定语义见 [Button 基础组件 Guide](../../../../docs/guide/Button基础组件.md)。
 */
import { kit, type KitComponent } from '../../tools/kit'
import { clickable } from '../../plugins/kits/clickable/clickable'
import { Piv } from '../../Piv/Piv'
import { createVariantPropsParser } from '../utils/parseVariantProps'
import { createStatusPropsParser } from '../utils/parseStatusProps'
import {
  componentName,
  buttonPropDefinition,
  buttonStatusCandidates,
  buttonVariantGroups,
  type ButtonProps,
  type ButtonController,
} from './Button.prop'
import { buttonMapping } from './Button.mapping'
import * as buttonStyle from './Button.style'

const { buttonStyleConfig, ...buttonStyleTokens } = buttonStyle

/**
 * 将按钮的外观分类转换为节点声明，保留同组描述的互斥关系。
 */
const parseVariantProps = createVariantPropsParser(
  buttonVariantGroups,
  buttonMapping,
)

/**
 * 将按钮状态映射为禁用和忙碌属性，并保留可操作的状态协议。
 */
const parseStatusProps = createStatusPropsParser({
  candidates: buttonStatusCandidates,
  effect: ({ loading, disabled }) => ({
    htmlProps: {
      disabled,
      'aria-busy': loading,
    },
  }),
})

/**
 * 呈现可执行动作，按外观和状态输入更新按钮。
 * 用户执行动作时交付 onClick，原生节点声明沿用 Piv 契约。
 */
export const Button: KitComponent<{
  props: ButtonProps
  controller: ButtonController
  styleTokens: typeof buttonStyleTokens
}> = kit(
  {
    name: componentName,
    description: '执行动作',
    propDefinition: buttonPropDefinition,
    variantGroups: buttonVariantGroups,
    styleTokens: buttonStyleTokens,
    styleConfig: buttonStyleConfig,
  },
  (props, { name, exposeController }) => {
    const { effect: variantEffectProps } = parseVariantProps(props)
    const { effect: statusEffectProps, controller } = parseStatusProps(props)
    exposeController(controller)

    return (
      <Piv
        as="button"
        shadowProps={[props, ...variantEffectProps, ...statusEffectProps]}
        class={name}
        is={[clickable({ componentName: name })]}
        on={{ click: props.onClick }}
      >
        {props.children}
      </Piv>
    )
  },
)
