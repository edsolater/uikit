/** Value 包装业务内容，并决定如何将其解析结果输出为 CSS。 */
import { assert } from '@edsolater/fnkit'
import { isJSSContent } from './content'
import type { JSSContent, JSSContentReader } from './content'

export type ValueInput = string | number | JSSContent | undefined
/** Value 自己持有的数据；裸 RuleValue 数组仍由 Rules 解释。 */
export type ValueData = ValueInput | boolean | null | object
export type ValueToCSSString<T extends ValueData = ValueData> = (content: T, read: JSSContentReader) => string | undefined

export interface ValueOptions<T extends ValueData = ValueData> extends Pick<JSSContent, 'onActive'> {
  /** 随 Value 解析的内容；省略时从 content 及嵌套数组取得内容对象。 */
  contents?: ValueInput[]
  /** 根据原内容与各子项的解析结果输出 CSS。 */
  toCSSString?: ValueToCSSString<T>
}

/** Value 保留原 content 身份，子内容在自己的声明位置解析。 */
export interface Value<T extends ValueData = ValueData> extends JSSContent {
  kind: 'value'
  content: T
  contents: ValueInput[]
  toCSSString(read?: JSSContentReader): string | undefined
}

/** 找出数组中的内容对象，原语和纯数据对象留给 Value 自身输出。 */
function valueContents(content: unknown, active = new Set<object>(), depth = 0): JSSContent[] {
  assert(depth <= 256, 'Value 数组嵌套超过上限 256。')
  if (Array.isArray(content)) {
    assert(!active.has(content), 'Value 数组存在循环引用。')
    active.add(content)
    try { return content.flatMap((item) => valueContents(item, active, depth + 1)) }
    finally { active.delete(content) }
  }
  return isJSSContent(content) ? [content] : []
}

/** 按类型读取内容；嵌套数组各自保持逗号分隔。 */
function defaultToCSSString(content: unknown, read: JSSContentReader, active = new Set<object>(), depth = 0): string | undefined {
  assert(depth <= 256, 'Value 数组嵌套超过上限 256。')
  if (content === undefined || content === null) return undefined
  if (Array.isArray(content)) {
    assert(!active.has(content), 'Value 数组存在循环引用。')
    active.add(content)
    try { return joinCSSValues(content, read, ', ', active, depth + 1) }
    finally { active.delete(content) }
  }
  return isJSSContent(content) ? read(content) : String(content)
}

/** 跳过空项，再以指定分隔符连接已解析内容。 */
function joinCSSValues(content: unknown[], read: JSSContentReader, separator: string, active = new Set<object>(), depth = 0): string | undefined {
  const values = content.map((item) => defaultToCSSString(item, read, active, depth)).filter((item) => item !== undefined)
  return values.length ? values.join(separator) : undefined
}

/** 按原顺序输出空格分隔的数组，跳过未定义项。 */
export function arraySequenceToCSSString(content: ValueData[], read: JSSContentReader): string | undefined {
  return joinCSSValues(content, read, ' ')
}

/**
 * 包装内容；数组默认递归以逗号连接，可指定自己的 CSS 输出规则。
 * @example
 * rules('.example', [[key('--numbers'), value([1, 2])]])
 * compileCSS().includes('--numbers: 1, 2;') // true
 * rules('.stack', [[key('z-index'), value(3, { toCSSString: (number: number) => String(number * 2) })]])
 * compileCSS().includes('z-index: 6;') // true
 */
export function value<T extends ValueData>(content: T, options?: ValueOptions<T>): Value<T> {
  return {
    kind: 'value',
    content,
    onActive: options?.onActive,
    get contents() {
      const current = this.content
      return options?.contents ?? valueContents(current)
    },
    toCSSString(read) {
      const resolved = read ?? (() => undefined)
      const readValue: JSSContentReader = (child) => defaultToCSSString(child, resolved)
      const current = this.content
      if (options?.toCSSString) return options.toCSSString(current, readValue)
      return readValue(current)
    },
  }
}
