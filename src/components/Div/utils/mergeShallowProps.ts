import { shakeNil } from '@edsolater/fnkit'
import { DivProps, HTMLTagMap, ShallowDivProps, _DivProps } from '../type'

export function mergeShallowProps<TagName extends keyof HTMLTagMap = 'div'>(
  props: DivProps<TagName> & _DivProps<TagName> & ShallowDivProps<TagName>
): DivProps<TagName> {
  const merged = shakeNil({
    ...props,
    children: props.children ?? props.mergeProps?.children,
    as: props.as ?? props.mergeProps?.as,

    classname: [props.mergeProps?.className, props.className],
    onClick: [props.mergeProps?.onClick, props.onClick],
    domRef: [props.mergeProps?.domRef, props.domRef],
    tag: [props.mergeProps?.tag, props.tag],
    style: [props.mergeProps?.style, props.style],
    icss: [props.mergeProps?.icss, props.icss],
    htmlProps: [props.mergeProps?.htmlProps, props.htmlProps],

    toMerge: undefined
  }) as DivProps<TagName>
  return merged
}
