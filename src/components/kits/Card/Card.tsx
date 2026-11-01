/**
 * 可独立理解的信息体入口。
 *
 * 为同一对象或主题的内容声明 Card 身份，并复用 Board 的完整承载能力。
 *
 * 两种方言共享实现，不通过额外容器模拟语义差异。
 */
import { kit } from '@/components/utils/kit'
import type { JSX } from '@/foundation'
import { boardPropsDefinition, getBoardPropsDirectorOptions } from '../Board/Board.prop'
import type { PivSupportedElementTag } from '../../Piv/domMap'
import {
  renderBoard,
  type BoardProps,
  type BoardVariantProps,
  type BoardSizeProps,
  type BoardController,
  type BoardControllerCollection,
} from '../Board/Board'
/** 独立信息体的材质声量。 */
export type CardVariantProps = BoardVariantProps
/** 独立信息体的内部容纳尺度。 */
export type CardSizeProps = BoardSizeProps
/** Card 保持完整承载契约，语义上是可独立理解的信息体。 */
export type CardProps<Tag extends PivSupportedElementTag = 'div'> =
  BoardProps<Tag>
/** Card 自有集合中的实例控制入口，字段契约复用 Board。 */
export type CardController<Tag extends PivSupportedElementTag = 'div'> = BoardController<Tag>

interface CardComponent {
  <Tag extends PivSupportedElementTag = 'div'>(props: CardProps<Tag>): JSX.Element
  controllers: BoardControllerCollection
}

/**
 * 将同一主题的内容呈现为独立信息体，保留动态材质、尺寸与原生节点能力。
 */
// kit 原样包装泛型核心；这里只恢复原 Card 的 Tag 与 Props 调用关联。
export const Card = kit<CardProps<PivSupportedElementTag>, typeof boardPropsDefinition>(
  {
    name: 'Card',
    description: '组织独立信息',
    availableProps: boardPropsDefinition,
    directorOptions: getBoardPropsDirectorOptions,
  },
  <Tag extends PivSupportedElementTag = 'div'>(props: CardProps<Tag>) => renderBoard(props, 'Card'),
) as CardComponent
