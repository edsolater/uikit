/**
 * 可独立理解的信息体入口。
 *
 * 为同一对象或主题的内容声明 Card 身份，并复用 Board 的完整承载能力。
 *
 * 两种方言共享实现，不通过额外容器模拟语义差异。
 */
import type { PivSupportedElementTag } from '../../Piv/domMap'
import {
  renderBoard,
  type BoardProps,
  type BoardVariantProps,
  type BoardSizeProps,
} from '../Board/Board'
/** 独立信息体的材质声量。 */
export type CardVariantProps = BoardVariantProps
/** 独立信息体的内部容纳尺度。 */
export type CardSizeProps = BoardSizeProps
/** Card 保持完整承载契约，语义上是可独立理解的信息体。 */
export type CardProps<Tag extends PivSupportedElementTag = 'div'> =
  BoardProps<Tag>
/**
 * 将同一主题的内容呈现为独立信息体，保留动态材质、尺寸与原生节点能力。
 */
export function Card<Tag extends PivSupportedElementTag = 'div'>(
  props: CardProps<Tag>,
) {
  return renderBoard(props, 'Card')
}
