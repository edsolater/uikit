/** 业务数据的 JSS 内容包装。
 *
 * 保留原始数据与输出配置，并按需暴露子内容依赖和资源。
 *
 * 支持数据替换复用原格式，纯内容包装保持 Expression 契约。
 */
import { assert, containKey, isArray, isFunction, isNullish } from '@edsolater/fnkit'
import { isJSSContent } from './content'
import type { Expression, JSSContent, JSSContentResolver } from './content'

export type ValueInput = string | number | JSSContent | undefined
/** Value 自己持有的数据；裸 RuleValue 数组仍由 Rules 解释。 */
export type ValueData = ValueInput | boolean | null | object
export type ValueToCSSString<T extends ValueData = ValueData> = (content: T, resolve: JSSContentResolver) => string | undefined

export interface ValueOptions<T extends ValueData = ValueData> extends Pick<JSSContent, 'onActive'> {
  /** 随 Value 编译的依赖内容；省略时从 content 及嵌套数组取得内容对象。 */
  dependencies?: ValueInput[] | ((content: T) => ValueInput[])
  /** 根据原内容与各子项的编译结果输出 CSS。 */
  toCSSString?: ValueToCSSString<T>
}

/** Value 保留原 content 身份，子内容在自己的声明位置编译。 */
export interface Value<T extends ValueData = ValueData> extends JSSContent {
  kind: 'value'
  content: T
  dependencies: ValueInput[]
  toCSSString(resolve?: JSSContentResolver): string | undefined
  /** 用新内容创建独立 Value，沿用本 Value 的输出规则和依赖配置。 */
  withContent(content: T): Value<T>
}

/** 没有自身生命周期的 Value；替换原内容后仍遵守 Expression 边界。 */
export type ExpressionValue<T extends ValueData = ValueData> = Omit<Value<T>, 'withContent'> & Expression & {
  withContent(content: T): ExpressionValue<T>
}

/**
 * 识别对象持有的 Value 身份，不展开内容。
 */
export const isValue = (input: unknown): input is Value => containKey(input, 'kind') && input.kind === 'value'

/**
 * 找出数组中的内容对象，原语和纯数据对象留给 Value 自身输出。
 */
function valueContents(content: unknown, active = new Set<object>(), depth = 0): ValueInput[] {
  assert(depth <= 256, 'Value 数组嵌套超过上限 256。')
  if (isArray(content)) {
    assert(!active.has(content), 'Value 数组存在循环引用。')
    active.add(content)
    try { return content.flatMap((item) => valueContents(item, active, depth + 1)) }
    finally { active.delete(content) }
  }
  return isJSSContent(content) ? [content] : []
}

/**
 * 按类型输出内容；嵌套数组各自保持逗号分隔。
 */
function defaultToCSSString(content: unknown, resolve: JSSContentResolver, active = new Set<object>(), depth = 0): string | undefined {
  assert(depth <= 256, 'Value 数组嵌套超过上限 256。')
  if (isNullish(content)) return undefined
  if (isArray(content)) {
    assert(!active.has(content), 'Value 数组存在循环引用。')
    active.add(content)
    try { return joinCSSValues(content, resolve, ', ', active, depth + 1) }
    finally { active.delete(content) }
  }
  return isJSSContent(content) ? resolve(content) : String(content)
}

/**
 * 跳过空项，再以指定分隔符连接已输出的内容。
 */
function joinCSSValues(content: unknown[], resolve: JSSContentResolver, separator: string, active = new Set<object>(), depth = 0): string | undefined {
  const values = content.map((item) => defaultToCSSString(item, resolve, active, depth)).filter((item) => item !== undefined)
  return values.length ? values.join(separator) : undefined
}

/**
 * 按原顺序输出空格分隔的数组，跳过未定义项。
 */
export const arraySequenceToCSSString = (content: ValueData[], resolve: JSSContentResolver): string | undefined =>
  joinCSSValues(content, resolve, ' ')

/**
 * 包装内容；数组默认递归以逗号连接，可指定自己的 CSS 输出规则。
 * @example
 * rules('.example', [[key('--numbers'), value([1, 2])]])
 * compileCSS().includes('--numbers: 1, 2;') // true
 * rules('.stack', [[key('z-index'), value(3, { toCSSString: (number: number) => String(number * 2) })]])
 * compileCSS().includes('z-index: 6;') // true
 */
export function value<T extends ValueData>(content: T, options: ValueOptions<T> & { onActive: NonNullable<JSSContent['onActive']> }): Value<T>

/**
 * 包装没有自身激活行为的内容；替换内容后仍只组织依赖与输出。
 */
export function value<T extends ValueData>(content: T, options?: ValueOptions<T> & { onActive?: never }): ExpressionValue<T>

/**
 * 包装内容并按需提供资源；未携带激活行为的选项使用 ExpressionValue 契约。
 */
export function value<T extends ValueData>(content: T, options?: ValueOptions<T>): Value<T>

/**
 * 沿用原配置输出内容，withContent 只替换数据，不改变激活与输出约定。
 */
export function value<T extends ValueData>(content: T, options?: ValueOptions<T>): Value<T> {
  return {
    kind: 'value',
    content,
    withContent: content => value(content, options),
    onActive: options?.onActive,
    get dependencies() {
      const current = this.content
      return isFunction(options?.dependencies) ? options.dependencies(current) : options?.dependencies ?? valueContents(current)
    },
    toCSSString(resolve) {
      const resolver = resolve ?? (() => undefined)
      const resolveValue: JSSContentResolver = (child) => defaultToCSSString(child, resolver)
      const current = this.content
      if (options?.toCSSString) return options.toCSSString(current, resolveValue)
      return resolveValue(current)
    },
  }
}
