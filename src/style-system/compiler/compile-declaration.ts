/** Declaration 的语法编译。 */
import type { Declaration } from '../core/css-declaration'
import { toConditionPath } from '../core/css-condition'
import type { ValueInput } from '../core/css-value'
import { declarationSyntax, propertyName } from '../core/css-key'
import { isVariable, type Variable, type VariableInput } from '../core/css-variable'
import type { FontParts } from '../properties/font'
import type { PaddingSides } from '../properties/padding'
import type { Transition } from '../values/transition'
import { compileValueParts, compileValue, type ValueContext, type ValueResult } from './compile-value'

/** 带完整条件贡献的声明候选。 */
export interface DeclarationResult extends ValueResult { property: string }

/** 按 Key 语法解析 Declaration 候选。 */
export function compileDeclaration(input: Declaration<unknown>, context: ValueContext): DeclarationResult[] {
  const [key, content] = input
  const name = propertyName(key)
  const syntax = declarationSyntax(key)
  /** 为值结果补充并展开目标属性。 */
  const expandValues = (values: ValueResult[], property = name) => values.flatMap((value) => expandProperty(property, value))
  /** 编译并组合同一消费位置的组成部分。 */
  const compose = (parts: ValueInput[], format: (parts: string[]) => string) => compileValueParts(parts, context, format)
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
        return [propertyName(property), duration, easing, ...(delay === undefined ? [] : [delay])]
      })
      return expandValues(compose(entries.flat(), (parts) => {
        let offset = 0
        return entries.map((entry) => {
          const text = parts.slice(offset, offset + entry.length).join(' ')
          offset += entry.length
          return text
        }).join(', ')
      }))
    }
  }
  throw new Error(`不支持 ${name} 的声明语法。`)
}

/** 在各条件地址改写同一个 Custom Property。 */
export function compileVariableDeclaration(reference: Variable, input: VariableInput, context: ValueContext): DeclarationResult[] {
  const property = `--${reference.name}`
  if (Array.isArray(input)) {
    return input.flatMap(([conditionInput, value]) => {
      const path = toConditionPath(conditionInput)
      return compileValue(value, context, [...(context.conditions ?? []), path]).map((result) => ({ ...result, property }))
    })
  }
  return compileValue(input, context).map((result) => ({ ...result, property }))
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
