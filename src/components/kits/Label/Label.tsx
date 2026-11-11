/** 字段标题通过for关联独立控件，tooltip将辅助提示挂在末尾问号。 */
import { Show, stateView, val, type Source } from '@/foundation'
import { hasTooltipContent } from '@/components/plugins/kits/tooltip/tooltip'
import { Help } from '../Help/Help'
import type { ComponentDescriptionProps } from '@/components/tools/KitMarker/KitMarker'
import type { RefReceiver } from '@/hooks/createRef'
import { kit, type KitController } from '@/components/tools/kit'
import { Piv, type PivProps } from '@/components/Piv/Piv'
import { labelPropsDefinition } from './Label.prop'
import './Label.style'
import { useFormFieldId } from '../FormField/FormField'

/** 通过 for 关联独立输入；tooltip 为空时不创建问号。 */
export type LabelProps = ComponentDescriptionProps & {
  /** 特殊运行期需求下接收本实例 Controller，初始界面仍由 Props 表达。 */
  ref?: RefReceiver<LabelController>
  for?: Source<string | undefined>
  children: Source<string>
  tooltip?: PivProps['children']
  /** 替换默认问号的显示内容，不嵌入另一个交互控件。 */
  tooltipTrigger?: PivProps['children']
}

/** 字段关联、标题与辅助说明的指令式入口，不拥有被关联控件的状态。 */
export type LabelController = KitController<
  LabelProps,
  typeof labelPropsDefinition
>

/**
 * 显示标题与说明，保持原生表单关联，浮层不参与字段布局。
 */
export const Label = kit(
  { name: 'Label', availableProps: labelPropsDefinition },
  (props: LabelProps) => {
    const fieldId = useFormFieldId()
    return (
    <Piv as="span" class="Label">
      <Piv as="label" htmlProps={{ for: val(props.for) ?? fieldId ?? undefined }}>
        {props.children}
      </Piv>
      <Show when={hasTooltipContent(props.tooltip)}>
        <Help
          tooltip={props.tooltip}
          trigger={props.tooltipTrigger}
          name={stateView(() => val(props.children) + '说明')}
        />
      </Show>
    </Piv>
    )
  },
)
