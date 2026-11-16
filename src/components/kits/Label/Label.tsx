/**
 * Label 是独立控件的可见字段标题。
 *
 * 通过 for 关联控件，并在需要时提供辅助说明入口。
 *
 * 让标题、控件和说明各自保持职责，通过字段身份协作。
 */
import { Show, stateView, val } from '@/foundation'
import { Help } from '../Help/Help'
import { Piv } from '../../Piv/Piv'

import { hasTooltipContent } from '../../plugins/kits/tooltip/tooltip'

import { kit, type KitComponent } from '../../tools/kit'

import {
  componentName,
  labelPropDefinition,
  type LabelProps,
  type LabelController,
} from './Label.prop'
import './Label.style'
import { useFormFieldId } from '../FormField/FormField'

/**
 * 显示标题与说明，保持原生表单关联，浮层不参与字段布局。
 */
export const Label: KitComponent<{
  props: LabelProps
  controller: LabelController
}> = kit(
  { name: componentName, propDefinition: labelPropDefinition },
  (props, { name }) => {
    const fieldId = useFormFieldId()
    return (
      <Piv as="span" shadowProps={props} class={name}>
        <Piv
          as="label"
          htmlProps={{ for: val(props.for) ?? val(fieldId) ?? undefined }}
        >
          {props.children}
        </Piv>
        <Show when={hasTooltipContent(props.tooltip)}>
          <Help
            tooltip={props.tooltip}
            trigger={props.tooltipTrigger}
            label={stateView(() => val(props.children) + '说明')}
          />
        </Show>
      </Piv>
    )
  },
)
