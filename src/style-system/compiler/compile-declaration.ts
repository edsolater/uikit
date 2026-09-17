/** Declaration 的语法规则集中在编译阶段；构造端只记录内容。 */
import type { Declaration } from '../core/css-declaration'
import type { ValueInput } from '../core/css-value'
import { propertyName } from '../core/css-key'
import { isVariable, variableConditionKey, variableName, type Variable } from '../core/css-variable'
import type { FontParts } from '../declarations/font'
import type { PaddingSides } from '../declarations/padding'
import type { Transition } from '../values/transition'
import { combineValues, compileAt, compileValue, conditionPathKey, valuePaths, type ValueContext, type ValueResult } from './compile-value'

/** 一条已经展开属性语法、但仍携带相对 Condition Path 的 CSS 声明结果。 */
export interface DeclarationResult extends ValueResult { property: string }

/**
 * 按声明语法组合子值，再扩写可确定方向的简写；结果路径相对 context.path，属性使用声明自身名称。
 * 组合会传播各子值的 Condition，并通过 context 激活被访问的依赖；不登记 Rule 或写 DOM。
 * @example
 * // 本例只使用原始值，无需激活依赖；正式编译由 compileRules 提供 activate。
 * // resolving 跟踪尚未退出的取值链，本次调用从空链开始。
 * const context: ValueContext = { root: new Map(), path: [], resolving: new Map(), activate() {} }
 * compileDeclaration(padding('4px', '8px'), context)
 * // 路径均为 []，依次为 padding-top: 4px、right: 8px、bottom: 4px、left: 8px。
 */
export function compileDeclaration(input: Declaration<string, unknown>, context: ValueContext): DeclarationResult[] {
  const { content, syntax, name } = input
  /**
   * 给值结果补充目标属性，并按 expandProperty 的规则展开方向；保留各自相对路径。
   * @example
   * expandValues([{ path: [], text: 'red' }], 'color') // [{ path: [], property: 'color', text: 'red' }]
   */
  const expandValues = (values: ValueResult[], property = name) => values.flatMap((value) => expandProperty(property, value))
  /**
   * 在同一消费位置编译各组成部分，再用 format 组合每个适用路径的文本。
   * @example
   * compose(['1px', 'solid', 'red'], (parts) => parts.join(' ')) // [{ path: [], text: '1px solid red' }]
   */
  const compose = (parts: ValueInput[], format: (parts: string[]) => string) => combineValues(parts.map((item) => compileValue(item, context)), format)
  if (isVariable(input.property)) return compileVariableDeclaration(input.property, content as ValueInput | Record<string, ValueInput>, context)
  switch (syntax) {
    case 'value': return expandValues(compileValue(content as ValueInput, context))
    case 'border': return expandValues(compose(content as ValueInput[], (parts) => parts.join(' ')))
    case 'margin':
    case 'padding': {
      if (Array.isArray(content)) return expandValues(compose(content, (parts) => parts.join(' ')))
      const sides = content as PaddingSides
      return (['top', 'right', 'bottom', 'left'] as ('top' | 'right' | 'bottom' | 'left')[]).flatMap((side) =>
        sides[side] === undefined ? [] : expandValues(compileValue(sides[side], context), `${name}-${side}`),
      )
    }
    case 'font': {
      if (typeof content !== 'object' || content === null || content instanceof Map || 'kind' in content) return expandValues(compileValue(content as ValueInput, context))
      const font = content as FontParts
      const parts = [font.style, font.weight, font.size, font.lineHeight, font.family].filter((item) => item !== undefined)
      return expandValues(compose(parts, (values) => {
        let index = 0
        const style = font.style === undefined ? '' : `${values[index++]} `
        const weight = font.weight === undefined ? '' : `${values[index++]} `
        const size = values[index++]
        const leading = font.lineHeight === undefined ? '' : `/${values[index++]}`
        return `${style}${weight}${size}${leading} ${values[index]}`
      }))
    }
    case 'box-shadow': return expandValues(Array.isArray(content)
      ? compose(content, (parts) => parts.join(', '))
      : compileValue(content as ValueInput, context))
    case 'transition': {
      if (!Array.isArray(content)) return expandValues(compileValue(content as ValueInput, context))
      const entries = (content as Transition[]).map(([property, duration, easing, delay]) => {
        if (typeof property === 'object' && 'kind' in property) context.activate(property)
        return compose([propertyName(property), duration, easing, ...(delay === undefined ? [] : [delay])], (parts) => parts.join(' '))
      })
      return expandValues(combineValues(entries, (parts) => parts.join(', ')))
    }
  }
}

/**
 * 把一次逻辑 Variable 重定义投影到它已有的 Condition Key，并将每个匹配 Key 编译成同一 Rule 地址下的独立 Custom Property。
 * 普通 Value 以自身实际路径提供 Key；对象只读取与 Variable 已有 Condition name 匹配的属性。未提供或未匹配的 Key 不输出。
 * @example
 * const background = variable('background', { fallback: value('red', [[whenHover, 'blue']]) })
 * const context: ValueContext = { root: new Map(), path: [], resolving: new Map(), activate() {} }
 * compileVariableDeclaration(background, { hover: 'cyan' }, context)
 * // [{ path: [], property: '--background-when-hover', text: 'cyan' }]
 */
export function compileVariableDeclaration(reference: Variable, input: ValueInput | Record<string, ValueInput>, context: ValueContext): DeclarationResult[] {
  const referencePaths = valuePaths(reference)
  const properties = new Map(referencePaths.map((path) => [conditionPathKey(path), `--${variableName(reference.name, path)}`]))
  const isObjectInput = typeof input === 'object' && input !== null && !(input instanceof Map) && !('kind' in input)
  if (isObjectInput) {
    return referencePaths.flatMap((path) => {
      const key = variableConditionKey(path)
      if (!Object.hasOwn(input, key)) return []
      const value = input[key]
      const valueContext = { ...context, path: [...context.path, ...path] }
      return [{ path: [], property: properties.get(conditionPathKey(path))!, text: compileAt(value, path, valueContext) }]
    })
  }
  return valuePaths(input as ValueInput).flatMap((path) => {
    const property = properties.get(conditionPathKey(path))
    if (property === undefined) return []
    const valueContext = { ...context, path: [...context.path, ...path] }
    return [{ path: [], property, text: compileAt(input as ValueInput, path, valueContext) }]
  })
}

/**
 * 将 margin/padding 的一至四项文本按上、右、下、左展开，保留路径及 CSS 内的括号表达。
 * 其他属性、含 var() 或项数不在一至四之间的文本原样保留，不代替浏览器校验 CSS。
 * @example
 * expandProperty('margin', { path: [], text: '4px 8px' })
 * // 依次得到 margin-top/right/bottom/left，文本为 4px/8px/4px/8px。
 * expandProperty('padding', { path: [], text: 'var(--space)' })
 * // [{ path: [], property: 'padding', text: 'var(--space)' }]
 */
export function expandProperty(property: string, value: ValueResult): DeclarationResult[] {
  if (!['margin', 'padding'].includes(property) || /var\(/.test(value.text)) return [{ ...value, property }]
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let index = 0; index < value.text.length; index++) {
    const char = value.text[index]
    if (char === '(') depth++
    if (char === ')') depth--
    if (/\s/.test(char) && depth === 0) {
      if (index > start) parts.push(value.text.slice(start, index))
      start = index + 1
    }
  }
  if (start < value.text.length) parts.push(value.text.slice(start))
  if (parts.length < 1 || parts.length > 4) return [{ ...value, property }]
  const [top, right = top, bottom = top, left = right] = parts
  return ['top', 'right', 'bottom', 'left'].map((side, index) => ({ ...value, property: `${property}-${side}`, text: [top, right, bottom, left][index] }))
}
