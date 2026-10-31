/** 字段标题通过for关联独立控件，tooltip将辅助提示挂在末尾问号。 */
import { Show, stateView, val, type Source } from '@/foundation'
import {
  hasTooltipContent,
  tooltip,
} from '@/components/plugins/kits/tooltip/tooltip'
import {
  ComponentMarker,
  type ComponentDescriptionProps,
} from '@/components/ComponentMarker/ComponentMarker'
import { Piv, type PivProps } from '@/components/Piv/Piv'
import './Label.style'

/** 通过 for 关联独立输入；tooltip 为空时不创建问号。 */
export type LabelProps = ComponentDescriptionProps & {
  for: Source<string>
  children: Source<string>
  tooltip?: PivProps['children']
  /** 替换默认问号的显示内容，不嵌入另一个交互控件。 */
  tooltipTrigger?: PivProps['children']
}

/**
 * 显示标题与说明，保持原生表单关联，浮层不参与字段布局。
 */
export function Label(props: LabelProps) {
  return (
    <ComponentMarker
      componentName="Label"
      description={props.description}
      descriptionDisplay={props.descriptionDisplay}
    >
      <Piv as="span" class="Label">
        <Piv as="label" htmlProps={{ for: props.for }}>
          {props.children}
        </Piv>
        <Show when={hasTooltipContent(props.tooltip)}>
          <Piv
            as="button"
            class="tooltipTrigger"
            plugin={tooltip({
              get content() { return props.tooltip },
            })}
            htmlProps={{
              'type': 'button',
              'aria-label': stateView(() => val(props.children) + '说明'),
            }}
          >
            {val(props.tooltipTrigger) ?? '?'}
          </Piv>
        </Show>
      </Piv>
    </ComponentMarker>
  )
}
