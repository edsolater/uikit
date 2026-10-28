/**
 * 按需展开的内容承载机制。
 *
 * 保留原生摘要、开关和键盘行为。
 *
 * 调用方决定正文的信息意义及其布局。
 */
import {
  ComponentWrapper,
  type ComponentDescriptionProps,
} from '@/components/ComponentWrapper/ComponentWrapper'
import { type Source, type JSX } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
/**
 * 保留原生键盘与展开语义的按需阅读区域。
 */
export function Details(
  props: ComponentDescriptionProps & {
    summary: Source<string>
    open?: Source<boolean>
    children?: JSX.Element
  },
) {
  return (
    <ComponentWrapper
      componentName="Details"
      defaultDescription="按需展开内容"
      description={props.description}
      descriptionDisplay={props.descriptionDisplay}
    >
      <Piv as="details" htmlProps={{ open: props.open }}>
        <Piv as="summary">{props.summary}</Piv>
        {props.children}
      </Piv>
    </ComponentWrapper>
  )
}
