/** 常用属性的组合工具；仍返回普通节点，不持有挂载状态。 */
import { display, alignItems, alignSelf, justifyContent } from '../css-properties/layout'

/** 行内弹性容器，内容双向居中；自身作为布局子项时也居中对齐。 */
export const inlineCenter = () => [
  display('inline-flex'),
  alignItems('center'),
  alignSelf('center'),
  justifyContent('center'),
]
