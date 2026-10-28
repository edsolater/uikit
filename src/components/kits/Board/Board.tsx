/**
 * 信息主体的底层承载能力。
 *
 * 统一提供材质、尺寸与原生节点声明，供 Board 和 Card 两种语义入口复用。
 *
 * 承载实现保持一份，身份差异不增加 DOM 或重复结构边界。
 */
import { Piv, type PivProps } from '../../Piv/Piv'
import type { PivSupportedElementTag } from '../../Piv/domMap'
import {
  ComponentWrapper,
  type ComponentDescriptionProps,
} from '@/components/ComponentWrapper/ComponentWrapper'
import {
  createVariantPropsParser,
  type VariantProps,
} from '../utils/parseVariantProps'
import './Board.style'

/** 材质声量；动态 variant 优先于确定描述词。 */
export type BoardVariantProps = VariantProps<'variant', 'soft' | 'solid'>
/** 内部容纳尺度；只调整内边距、内容间隔和圆角。 */
export type BoardSizeProps = VariantProps<'size', 'small' | 'large' | 'xlarge'>
/** 承载节点的原生能力、材质和结构用途。 */
export interface BoardProps<Tag extends PivSupportedElementTag = 'div'>
  extends
    PivProps<Tag>,
    BoardVariantProps,
    BoardSizeProps,
    ComponentDescriptionProps {}

const parseBoardVariantProps = createVariantPropsParser([
  { groupName: 'variant', candidates: ['soft', 'solid'] },
  { groupName: 'size', candidates: ['small', 'large', 'xlarge'] },
])

/**
 * 为上层信息主体提供有边界的承载，不自行声明独立信息意义。
 */
export function Board<Tag extends PivSupportedElementTag = 'div'>(
  props: BoardProps<Tag>,
) {
  return renderBoard(props, 'Board')
}

/**
 * 按指定语义身份呈现同一个承载节点；只供 Board 与 Card 定义端共享。
 */
export function renderBoard<Tag extends PivSupportedElementTag>(
  props: BoardProps<Tag>,
  identity: 'Board' | 'Card',
) {
  const { variantShadowProps } = parseBoardVariantProps(props)
  return (
    <ComponentWrapper
      componentName={identity}
      defaultDescription={
        identity === 'Card' ? '组织独立信息' : '承载上层信息主体'
      }
      description={props.description}
      descriptionDisplay={props.descriptionDisplay}
    >
      <Piv
        as={props.as}
        shadowProps={[props, variantShadowProps]}
        class={identity === 'Card' ? 'Board Card' : 'Board'}
      >
        {props.children}
      </Piv>
    </ComponentWrapper>
  )
}
