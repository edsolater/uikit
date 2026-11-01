/**
 * 按需展开的内容承载机制。
 *
 * 保留原生摘要、开关和键盘行为。
 *
 * 调用方决定正文的信息意义及其布局。
 */
import { kit, type KitController } from '@/components/utils/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { detailsPropsDefinition } from './Details.prop'
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'
import { type Source, type JSX } from '@/foundation'
import { Piv, type PivProps } from '@/components/Piv/Piv'
/** Details 的声明输入；初始状态通过 Props 表达。 */
export type DetailsProps = ComponentDescriptionProps & {
  ref?: RefReceiver<DetailsController>
  summary: PivProps['children']
  open?: Source<boolean | undefined>
  children?: JSX.Element
  domRef?: PivProps<'details'>['domRef']
  onToggle?: (open: boolean) => void
}

/** Details 自有 Props 的指令式入口；ref 只从上游交付。 */
export type DetailsController = KitController<
  DetailsProps,
  typeof detailsPropsDefinition
>

/**
 * 保留原生键盘与展开语义的按需阅读区域。
 */
export const Details = kit(
  {
    name: 'Details',
    description: '按需展开内容',
    availableProps: detailsPropsDefinition,
  },
  (props: DetailsProps) => {
    return (
      <Piv
        as="details"
        domRef={props.domRef}
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
