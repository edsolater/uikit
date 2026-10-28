/**
 * 消息反馈的语义边界材质。
 *
 * 从 Board 的公开边界材料派生语气颜色。
 *
 * 差异只作用当前根，不改动承载的内部布局或其他实例。
 */
import { rules, stateCondition, token } from '@/style-system'
import { boardBorder } from '../Board/Board.style'

const border = token(boardBorder, {
  name: 'message-board-border',
  state: [
    [stateCondition('&[data-tone="error"]'), '1px solid #dc2626'],
    [stateCondition('&[data-tone="success"]'), '1px solid #16a34a'],
    [stateCondition('&[data-tone="warning"]'), '1px solid #d97706'],
  ],
})

rules('.MessageBoard', {
  border,
  'overflow-wrap': 'anywhere',
})
