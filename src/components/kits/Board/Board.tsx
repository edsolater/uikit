/**
 * Board 是信息主体的底层承载组件。
 *
 * 为上层信息主体提供承载材质与原生节点，不增加额外容器。
 *
 * 上层主体复用同一承载行为，并保留自己的语义身份。
 */
import { Piv } from '../../Piv/Piv'
import { kit, type KitComponent } from '../../tools/kit'

import type { PivSupportedElementTag } from '../../Piv/domMap'
import { createVariantPropsParser } from '../utils/parseVariantProps'
import {
  componentName,
  boardPropDefinition,
  boardVariantGroups,
  type BoardProps,
  type BoardController,
  type BoardComponent,
} from './Board.prop'
import './Board.style'

/**
 * 将材质和尺度分类转换为根节点声明。
 */
const parseBoardVariantProps = createVariantPropsParser(boardVariantGroups)

/**
 * 固定定义供不同原生根使用，实例状态由 kit 各自创建。
 */
const boardComponent: KitComponent<{
  props: BoardProps<PivSupportedElementTag>
  controller: BoardController<PivSupportedElementTag>
}> = kit(
  {
    name: componentName,
    description: '承载上层信息主体',
    propDefinition: boardPropDefinition,
    variantGroups: boardVariantGroups,
  },
  (props, { name }) => renderBoard(props, name),
)

/**
 * 呈现承载节点；公开契约保持每次调用的 Tag 与 ref 对应。
 */
export const Board: BoardComponent = boardComponent as BoardComponent

/**
 * 按调用方选择的样式类呈现承载节点，保留原生字段及动态材质、尺寸。
 */
export function renderBoard<Tag extends PivSupportedElementTag>(
  props: Omit<BoardProps<Tag>, 'ref'>,
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
