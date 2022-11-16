import { DivProps, HTMLTagMap } from '../type'

export function collapseShallowProps<P extends Partial<DivProps<any>>>(props: P): Omit<P, 'shallowDivProps'> {
  return {
    ...props.shallowDivProps,
    ...props,

    children: props.children ?? props.shallowDivProps?.children,
    as: props.as ?? props.shallowDivProps?.as,

    className: [props.shallowDivProps?.className, props.className],
    onClick: [props.shallowDivProps?.onClick, props.onClick],
    domRef: [props.shallowDivProps?.domRef, props.domRef],
    tag: [props.shallowDivProps?.tag, props.tag],
    style: [props.shallowDivProps?.style, props.style],
    icss: [props.shallowDivProps?.icss, props.icss],
    htmlProps: [props.shallowDivProps?.htmlProps, props.htmlProps]
  }
}
