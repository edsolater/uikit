/**
 * 信息主体的底层承载能力。
 *
 * 提供网格承载、材质、尺寸与原生节点声明，供上层主体复用。
 *
 * 通用节点实现不解释调用方的语义身份，不增加额外DOM。
 */
import { Piv, type PivProps } from '../../Piv/Piv'
import type { PivSupportedElementTag } from '../../Piv/domMap'
import type { ComponentDescriptionProps } from '@/components/tools/KitMarker/KitMarker'
import {
  createVariantPropsParser,
  type VariantProps,
} from '../utils/parseVariantProps'
import { kit, type KitController } from '@/components/tools/kit'
import type { ControllerCollection } from '@/components/tools/controllerRegistry'
import type { RefReceiver } from '@/hooks/createRef'
import type { JSX } from '@/foundation'
import { boardPropsDefinition, boardVariantGroups, getBoardPropsDirectorOptions } from './Board.prop'
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
    ComponentDescriptionProps {
  ref?: RefReceiver<BoardController<Tag>>
}

/** 原生节点类型与对应 Props 的指令式入口。 */
export type BoardController<Tag extends PivSupportedElementTag = 'div'> = KitController<BoardProps<Tag>, typeof boardPropsDefinition>

/** 异构原生节点只公开共同安全字段。 */
export type BoardControllerCollection = ControllerCollection<{
  readonly props: Omit<BoardController<PivSupportedElementTag>['props'],
    'as' | 'htmlProps' | 'on' | 'domRef' | 'shadowProps' | 'is'>
}>

interface BoardComponent {
  <Tag extends PivSupportedElementTag = 'div'>(props: BoardProps<Tag>): JSX.Element
  controllers: BoardControllerCollection
}

const parseBoardVariantProps = createVariantPropsParser(boardVariantGroups)

/**
 * 为上层信息主体提供有边界的承载，不自行声明独立信息意义。
 */
// kit 原样包装泛型核心；这里恢复 TypeScript 在包装返回值中丢失的 Tag 调用关联。
export const Board = kit<BoardProps<PivSupportedElementTag>, typeof boardPropsDefinition>(
  {
    name: 'Board',
    description: '承载上层信息主体',
    availableProps: boardPropsDefinition,
    directorOptions: getBoardPropsDirectorOptions,
  },
  <Tag extends PivSupportedElementTag = 'div'>(props: BoardProps<Tag>) => renderBoard(props, 'Board'),
) as BoardComponent

/**
 * 按调用方选择的样式类呈现承载节点，保留原生字段及动态材质、尺寸。
 */
export function renderBoard<Tag extends PivSupportedElementTag>(
  props: BoardProps<Tag>,
  className: string,
) {
  const { effect: variantEffectProps } = parseBoardVariantProps(props)
  return (
    <Piv
      as={props.as}
      shadowProps={[props, ...variantEffectProps]}
      class={className}
    >
      {props.children}
    </Piv>
  )
}
