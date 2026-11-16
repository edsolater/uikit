/**
 * 按需展开的内容承载机制。
 *
 * 保留原生摘要、开关和键盘行为。
 *
 * 调用方决定正文的信息意义及其布局。
 */
import { Piv } from '../../Piv/Piv'
import { kit, type KitComponent } from '../../tools/kit'
import {
  componentName,
  detailsPropDefinition,
  type DetailsProps,
  type DetailsController,
} from './Details.prop'

/**
 * 保留原生键盘与展开语义的按需阅读区域。
 */
export const Details: KitComponent<{
  props: DetailsProps
  controller: DetailsController
}> = kit(
  {
    name: componentName,
    componentDescription: '按需展开内容',
    propDefinition: detailsPropDefinition,
  },
  (props, { name }) => {
    return (
      <Piv
        shadowProps={props}
        class={name}
        as="details"
        htmlProps={{ open: props.open }}
        on={{
          toggle: ({ element }) => {
            props.onToggle?.((element as HTMLDetailsElement).open)
          },
        }}
      >
        <Piv as="summary">{props.summary}</Piv>
        {props.children}
      </Piv>
    )
  },
)
