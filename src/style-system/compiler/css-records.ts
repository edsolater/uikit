/** 将 CSS 声明挂载为深度优先的有序记录数组。 */
import type { ConditionHeaders } from '../core/css-condition'

/** 已降级的 CSS 声明：条件、属性与内容。 */
export type CSSRecord = [conditions: (string | undefined)[], key: string | undefined, css: string]

/** 判断地址是否位于指定子树。 */
export function hasConditionPrefix(path: ConditionHeaders, prefix: ConditionHeaders): boolean {
  return path.length >= prefix.length && prefix.every((header, index) => path[index] === header)
}

/** 挂载最终地址，同址覆盖保留位置；不解读 Subject Condition。 */
export function mountCSSRecord(records: CSSRecord[], candidate: CSSRecord): void {
  const path = candidate[0].filter((header) => header !== undefined)
  const record: CSSRecord = [path, candidate[1], candidate[2]]
  const existing = records.findIndex(([conditions, key]) => key === record[1]
    && conditions.length === path.length && hasConditionPrefix(conditions, path))
  if (existing !== -1) {
    records[existing] = record
    return
  }

  let start = 0
  let end = records.length
  for (let depth = 1; depth <= path.length; depth++) {
    const prefix = path.slice(0, depth)
    let child = start
    while (child < end && !hasConditionPrefix(records[child][0], prefix)) child++
    if (child === end) {
      records.splice(end, 0, record)
      return
    }
    start = child
    end = start
    while (end < records.length && hasConditionPrefix(records[end][0], prefix)) end++
  }
  while (start < end && records[start][0].length === path.length) start++
  records.splice(start, 0, record)
}
