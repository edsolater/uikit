import { shakeNil } from '@edsolater/fnkit'
import { DivProps, HTMLTagMap, _DivProps } from '../type'

export function mergeShallowProps<TagName extends keyof HTMLTagMap = 'div'>(
  props: DivProps<TagName> & _DivProps<TagName>
): DivProps<TagName> {
  const merged = shakeNil({
    ...props,
    children: props.children ?? props.children_,
    as: props.as ?? props.as_,
    refId: props.refId ?? props.refId_,

    classname: [props.className_, props.className],
    onClick: [props.onClick_, props.onClick],
    domRef: [props.domRef_, props.domRef],
    tag: [props.tag_, props.tag],
    style: [props.style_, props.style],
    icss: [props.icss_, props.icss],
    htmlProps: [props.htmlProps_, props.htmlProps]
  }) as DivProps<TagName>
  return merged
}
