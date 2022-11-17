import { DivProps } from '../type'

export function collapseShallowProps<P extends Partial<DivProps<any>>>(props: P): Omit<P, 'shadowProps'> {
  return {
    ...props.shadowProps,
    ...props,

    children: props.children ?? props.shadowProps?.children,
    as: props.as ?? props.shadowProps?.as,

    className: [props.shadowProps?.className, props.className],
    onClick: [props.shadowProps?.onClick, props.onClick],
    domRef: [props.shadowProps?.domRef, props.domRef],
    tag: [props.shadowProps?.tag, props.tag],
    style: [props.shadowProps?.style, props.style],
    icss: [props.shadowProps?.icss, props.icss],
    htmlProps: [props.shadowProps?.htmlProps, props.htmlProps]
  }
}
