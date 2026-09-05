/** 保留 CSS value 的原始、动态、嵌套内容及其依赖关系。 */

export type CssRawValue = string | number
export type CssValueContent = CssRawValue | CssValue | CssValueParts
export type CssValueSource = CssValueContent | (() => CssValueContent)

export interface CssValue {
  /** 交付当前仍可嵌套和继续组合的 CSS 内容结果。 */
  cssString: () => CssValueContent
}

const cssValuePartsIdentity = Symbol('CssValueParts')

export interface CssValueParts {
  [cssValuePartsIdentity]: true
}

const contentByParts = new WeakMap<CssValueParts, CssValueContent[]>()
const dependenciesByValue = new WeakMap<CssValue, CssValueContent[]>()

/** 判断输入是否已经遵循 CssValue 的内容协议。 */
export function isCssValue(value: unknown): value is CssValue {
  return typeof value === 'object' && value !== null && 'cssString' in value && typeof value.cssString === 'function'
}

/**
 * 把原始、动态或嵌套内容保留为 CssValue，不在这里生成最终字符串。
 *
 * @example
 * const gap = cssValue(() => enabled() ? '8px' : '4px')
 */
export function cssValue(source: CssValueSource): CssValue {
  if (isCssValue(source)) return source

  /** 保留动态读取时机，并原样交回来源结果。 */
  function readCssValueContent(): CssValueContent {
    return typeof source === 'function' ? source() : source
  }

  const value = { cssString: readCssValueContent }
  if (typeof source !== 'function' && typeof source === 'object') dependenciesByValue.set(value, [source])
  return value
}

/** 按原始次序保存多个内容片段，供最终解析边界递归展开。 */
export function cssValueSequence(...content: CssValueContent[]): CssValue {
  const parts: CssValueParts = { [cssValuePartsIdentity]: true }
  contentByParts.set(parts, content)
  return cssValue(parts)
}

/** 按指定分隔符保存多个内容结果，不提前读取或压平任何 value。 */
export function joinCssValues(separator: string, ...values: CssValueContent[]): CssValue {
  const content: CssValueContent[] = []
  values.forEach((value, index) => {
    if (index > 0) content.push(separator)
    content.push(value)
  })
  return cssValueSequence(...content)
}

/** 判断结果是否是 cssValueSequence 保留的有序内容。 */
export function isCssValueParts(value: unknown): value is CssValueParts {
  return typeof value === 'object' && value !== null && contentByParts.has(value as CssValueParts)
}

/** 在最终解析时读取序列内容，不向组合调用方暴露可变数组。 */
export function readCssValueParts(parts: CssValueParts): CssValueContent[] {
  const content = contentByParts.get(parts)
  if (!content) throw new Error('收到的对象不是由 JSS 创建的 CssValueParts。')
  return content
}

/** 给 value 连接无需读取动态来源就能确定的生命周期依赖。 */
export function withCssValueDependencies(value: CssValue, ...dependencies: CssValueContent[]): CssValue {
  const currentDependencies = dependenciesByValue.get(value) ?? []
  currentDependencies.push(...dependencies)
  dependenciesByValue.set(value, currentDependencies)
  return value
}

/** 读取 value 在组合阶段已经明确连接的生命周期依赖。 */
export function readCssValueDependencies(value: CssValue): CssValueContent[] {
  return dependenciesByValue.get(value) ?? []
}
