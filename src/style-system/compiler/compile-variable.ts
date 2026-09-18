/** 变量引用与自身赋值。 */
import type { Variable, VariableInput } from '../core/css-variable'
import type { ValueInput } from '../core/css-value'
import { compileValue, type ValueContext, type ValueResult } from './compile-value'

/** 引用变量；条件缺省值只声明到变量自身。 */
export function compileVariableReference(reference: Variable, context: ValueContext): string {
  if (reference.fallback === undefined) return `var(--${reference.name})`
  const values = compileValue(reference.fallback, { ...context, conditions: [] })
  const base = values.find((item) => item.conditions.length === 0)
  if (!base) throw new Error('Variable 缺少可解析的 default。')
  if (values.some((item) => item.conditions.length > 0)) {
    const definitions = context.conditions?.length ? compileValue(reference.fallback, context) : values
    context.defineVariable(reference.name, definitions, context)
  }
  return `var(--${reference.name}, ${base.text})`
}

/** 编译完整赋值或局部分支；与 Value 共用条件选择，不共用身份。 */
export function compileVariableDeclaration(input: VariableInput, context: ValueContext): ValueResult[] {
  if (!Array.isArray(input)) return compileValue(input, context)
  let base: ValueInput
  const conditions: [string, ValueInput][] = []
  for (const [name, content] of input) {
    if (name === undefined) base = content
    else conditions.push([name, content])
  }
  return compileValue(base, context, conditions)
}
