/** 完整条目的逗号列表格式；不解释条目内容，也不创建值节点。 */
import type { RenderContext } from '../core/css-value'

/**
 * 保留顺序，将同一渲染上下文交给每个条目的解析器；数组条目不被继续展开。
 * @example formatCommaList([first, second], parseValue, context) // 两个完整值以逗号分隔，子值继续参与激活。
 * @example formatCommaList([[1, 2], [3, 4]], ([x, y]) => `${x} ${y}`) // '1 2, 3 4'
 */
export function formatCommaList<T>(
  items: T[],
  parseItem: (item: T, context?: RenderContext) => string,
  context?: RenderContext,
): string {
  return items.map((item) => parseItem(item, context)).join(', ')
}
