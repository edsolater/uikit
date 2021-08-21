import type { TagMap, DivProps } from './Div'
import { mergeProps } from '../functions'
import Div from './Div'

/**
 * 基础组件专用版<Div>，其  _props 会自动 merge
 */
export interface UIRootProps<TagName extends keyof TagMap = 'div'> extends DivProps<TagName> {
  _domRef?: DivProps<TagName>['domRef']
  _className?: DivProps<TagName>['className']
  _htmlProps?: DivProps<TagName>['htmlProps']
  _style?: DivProps<TagName>['style']
}

/**
 * 基础组件专用Div，_props 会自动合并到props上
 */
export default function UIRoot<TagName extends keyof TagMap = 'div'>(props: UIRootProps<TagName>) {
  return (
    <Div
      as={props.as}
      children={props.children}
      {...mergeProps(
        {
          className: props._className,
          domRef: props._domRef,
          style: props._style,
          htmlProps: props._htmlProps
        },
        props
      )}
    />
  )
}
