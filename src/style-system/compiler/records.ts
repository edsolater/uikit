/** 编译后的原生 CSS 声明。 */

/** 条件、属性与内容；记录顺序即输出顺序。 */
export type CSSRecord = [conditions: (string | undefined)[], key: string | undefined, css: string]

/** 同层同地址共同输出；只跨越互不覆盖的声明，保留原生属性及同名变量的层叠顺序。 */
export function groupCSSRecords(records: CSSRecord[]): CSSRecord[] {
  const output: CSSRecord[] = []
  for (const record of records) {
    const [path, key] = record
    const address = JSON.stringify(path.filter((header) => header !== undefined))
    let insertion = output.length
    // 定义类 At Rule 的每次出现都是完整定义，不跨条目合并。
    const movable = !path.some((header) => header?.startsWith('@') && !/^@(layer|media|supports|container|scope)\b/.test(header))
    if (movable) {
      for (let index = output.length - 1; index >= 0; index--) {
        const [previousPath, previousKey] = output[index]
        if (JSON.stringify(previousPath.filter((header) => header !== undefined)) === address) {
          insertion = index + 1
          break
        }
        // 不解析所有 CSS 简写关系：原生属性之间保守视为可能覆盖。
        if (key === undefined || previousKey === undefined || key === previousKey
          || (!key.startsWith('--') && !previousKey.startsWith('--'))
          || previousPath.some((header) => header?.startsWith('@') && !/^@(layer|media|supports|container|scope)\b/.test(header))) break
      }
    }
    output.splice(insertion, 0, record)
  }
  return output
}
