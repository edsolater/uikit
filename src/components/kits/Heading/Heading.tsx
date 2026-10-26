/**
 * Heading 承载具有明确文档层级的纯文字标题。
 *
 * level选择原生h1至h6，文字来源持续更新，定位框内保持独立标题身份。
 *
 * 不嵌套Text，不改变浏览器或调用方已提供的标题排版。
 */
import type { Source } from '@/foundation'
import {
  ComponentWrapper,
  type ComponentDescriptionProps,
} from '@/components/ComponentWrapper/ComponentWrapper'
import { Piv, type PivProps } from '@/components/Piv/Piv'
import './Heading.style'

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
type HeadingTag = `h${HeadingLevel}`

/** 标题层级必须显式提供，内容只接受纯文字来源。 */
export type HeadingProps = Omit<PivProps<HeadingTag>, 'as' | 'children'> &
  ComponentDescriptionProps & {
    level: HeadingLevel
    children?: Source<string | number | undefined>
  }

/**
 * 按明确层级显示标题，开启定位框时隐藏文字并保留标题自身的边界与说明。
 */
export function Heading(props: HeadingProps) {
  return (
    <ComponentWrapper
      componentName="Heading"
      description={props.description}
      descriptionDisplay={props.descriptionDisplay}
      descriptionOnly
    >
      <Piv<HeadingTag>
        as={`h${props.level}`}
        shadowProps={props}
        class="Heading"
      >
        {props.children}
      </Piv>
    </ComponentWrapper>
  )
}
