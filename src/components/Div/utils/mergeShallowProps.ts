import { shakeNil } from '@edsolater/fnkit'
import { DivProps, HTMLTagMap, ShallowDivProps, _DivProps } from '../type'

export function mergeShallowProps<TagName extends keyof HTMLTagMap = 'div'>(
  props: DivProps<TagName> & _DivProps<TagName> & ShallowDivProps<TagName>
): DivProps<TagName> {
  const merged = shakeNil({
    ...props,
    children: props.children ?? props.shallowDivProps?.children,
    as: props.as ?? props.shallowDivProps?.as,

    classname: [props.shallowDivProps?.className, props.className],
    onClick: [props.shallowDivProps?.onClick, props.onClick],
    domRef: [props.shallowDivProps?.domRef, props.domRef],
    tag: [props.shallowDivProps?.tag, props.tag],
    style: [props.shallowDivProps?.style, props.style],
    icss: [props.shallowDivProps?.icss, props.icss],
    htmlProps: [props.shallowDivProps?.htmlProps, props.htmlProps],

    toMerge: undefined
  }) as DivProps<TagName>
  return merged
}
