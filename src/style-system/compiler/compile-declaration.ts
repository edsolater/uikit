/** Declaration 的语法编译。 */
import type { Declaration } from '../core/css-declaration'
import { toConditionPath } from '../core/css-condition'
import type { ValueInput } from '../core/css-value'
import { declarationSyntax, propertyName } from '../core/css-key'
import { isVariable, variableName, type Variable, type VariableInput } from '../core/css-variable'
import type { FontParts } from '../properties/font'
import type { PaddingSides } from '../properties/padding'
import type { Transition } from '../values/transition'
import { combineValues, compileAt, compileValue, conditionPathKey, valuePaths, type ValueContext, type ValueResult } from './compile-value'

/** 带相对 Condition Path 的声明结果。 */
export interface DeclarationResult extends ValueResult { property: string }

/** 按 Key 语法编译 Declaration，并传播子值 Condition。 */
export function compileDeclaration(input: Declaration<unknown>, context: ValueContext): DeclarationResult[] {
  const [key, content] = input
  const name = propertyName(key)
  const syntax = declarationSyntax(key)
  /** 为值结果补充并展开目标属性。 */
  const expandValues = (values: ValueResult[], property = name) => values.flatMap((value) => expandProperty(property, value))
  /** 编译并组合同一消费位置的组成部分。 */
  const compose = (parts: ValueInput[], format: (parts: string[]) => string) => combineValues(parts.map((item) => compileValue(item, context)), format)
  if (isVariable(key)) return compileVariableDeclaration(key, content as VariableInput, context)
  switch (syntax) {
    case 'value': return expandValues(compileValue(content as ValueInput, context))
    case 'border': return expandValues(Array.isArray(content)
      ? compose(content as ValueInput[], (parts) => parts.join(' '))
      : compileValue(content as ValueInput, context))
    case 'margin': return expandValues(Array.isArray(content)
      ? compose(content, (parts) => parts.join(' '))
      : compileValue(content as ValueInput, context))
    case 'padding': {
      if (Array.isArray(content)) return expandValues(compose(content, (parts) => parts.join(' ')))
      if (typeof content !== 'object' || content === null || content instanceof Map || 'kind' in content) {
        return expandValues(compileValue(content as ValueInput, context))
      }
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
  throw new Error(`不支持 ${name} 的声明语法。`)
}

/** 把 Variable 重定义投影到已有 Condition Path。 */
export function compileVariableDeclaration(reference: Variable, input: VariableInput, context: ValueContext): DeclarationResult[] {
  const referencePaths = valuePaths(reference)
  const properties = new Map(referencePaths.map((path) => [conditionPathKey(path), `--${variableName(reference.name, path)}`]))
  if (Array.isArray(input)) {
    return input.flatMap(([conditionInput, value]) => {
      const path = toConditionPath(conditionInput)
      const property = properties.get(conditionPathKey(path))
      if (property === undefined) return []
      const valueContext = { ...context, path: [...context.path, ...path] }
      return [{ path: [], property, text: compileAt(value, path, valueContext) }]
    })
  }
  return valuePaths(input).flatMap((path) => {
    const property = properties.get(conditionPathKey(path))
    if (property === undefined) return []
    const valueContext = { ...context, path: [...context.path, ...path] }
    return [{ path: [], property, text: compileAt(input, path, valueContext) }]
  })
}

/** 展开 margin/padding 的一至四项静态简写；其他文本原样保留。 */
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
