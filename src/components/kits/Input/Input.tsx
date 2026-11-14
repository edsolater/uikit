/**
 * Input 是承载单行可编辑值的基础控件。
 *
 * 呈现输入值和字段状态，保留默认视觉形态及原生编辑行为。
 *
 * 将字段编辑与上层标题、说明、错误提示和布局分开。
 *
 * 组件选择规则见 [Input 设计规格](./Input.spec.md)。
 * 稳定语义见 [Input 基础组件 Guide](../../../../docs/guide/Input基础组件.md)。
 */
import { kit, type KitController } from '../../tools/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { inputPropsDefinition } from './Input.prop'
import { Piv, type PivProps } from '../../Piv/Piv'
import type { ComponentDescriptionProps } from '../../tools/KitMarker/KitMarker'
import {
  createStatusPropsParser,
  type StatusController,
} from '../utils/parseStatusProps'
import './Input.style'
import { useFormFieldId } from '../FormField/FormField'
import { type Source, val } from '@/foundation'
import {
  createInputValidity,
  type InputValidityProps,
} from './createInputValidity'

/** 单行编辑的原生声明与有效性输入，组件只额外限定输入类型。 */
export interface InputProps
  extends PivProps<'input'>, InputValidityProps, ComponentDescriptionProps {
  ref?: RefReceiver<InputController>
  /** 原生输入类型；省略时为单行文字。 */
  type?: Source<'text' | 'color' | undefined>
}

/**
 * 将输入有效性映射为节点的无障碍状态，不改写字段值。
 */
const parseInputStatusProps = createStatusPropsParser({
  candidates: ['invalid'],
  effect: ({ invalid }) => ({
    htmlProps: {
      'aria-invalid': invalid,
    },
  }),
})

/** 顶层公开输入有效性状态，props 提供通用输入干预；ref 只从上游交付。 */
export type InputController = KitController<
  InputProps,
  typeof inputPropsDefinition,
  StatusController<'invalid'>
>

/**
 * 编辑单行内容并呈现字段有效性，保持输入值与状态来源持续更新。
 */
export const Input = kit<InputProps, typeof inputPropsDefinition>(
  {
    name: 'Input',
    description: '编辑单行内容',
    propsDefinition: inputPropsDefinition,
  },
  (props: InputProps, context) => {
    const fieldId = useFormFieldId()
    const validity = createInputValidity(props)
    const isInvalid = validity.isValid.map((isValid) => !isValid)
    const { effect: statusEffectProps, controller } = parseInputStatusProps({
      invalid: isInvalid,
    })
    context.exposeController(controller)

    return (
      <Piv
        as="input"
        shadowProps={[props, ...statusEffectProps]}
        class="Input"
        id={val(props.id) ?? fieldId ?? undefined}
        htmlProps={{
          type: val(props.type) ?? 'text',
          autocorrect: 'off',
          spellcheck: 'false',
          autocomplete: 'off',
          autocapitalize: 'none',
        }}
      />
    )
  },
)
