/** 表达 CSS 内容写入的 key，不承担 value 语义或生命周期。 */

export type CssKey = string

/** 去除 key 两侧空白，并拒绝不能形成写入位置的空名称。 */
export function cssKey(name: string): CssKey {
  const key = name.trim()
  if (!key) throw new Error('CssKey 不能为空。')
  return key
}
