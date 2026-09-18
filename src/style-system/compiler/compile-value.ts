/** 解析 Value 与 CSS Function 的完整候选及条件贡献。 */
import type { ConditionPath } from '../core/css-condition'
import { resolveSubjectConditions } from '../subject-conditions'
import { isCSSPair } from '../core/css-declaration'
import type { Rules } from '../core/css-rule'
import type { CompileContext, Value, ValueInput, ValueExpression } from '../core/css-value'

/** 普通 Rules 的路径与 Value 贡献的 Subject Condition 名称。 */
export type ValueConditions = (ConditionPath | string)[]

/** 候选值及条件贡献；default 不贡献名称。 */
export interface ValueResult { conditions: ValueConditions; text: string }

/** 保留普通路径的顺序与重复，再追加规范化的 Subject Condition。 */
export function valueConditionPath(conditions: ValueConditions): ConditionPath {
  return [
    ...conditions.flatMap((entry) => typeof entry === 'string' ? [] : entry),
    ...resolveSubjectConditions(conditions.filter((entry) => typeof entry === 'string')).map((definition) => definition.condition),
  ]
}

/** Value 与本次编译会话的连接。 */
export interface ValueContext extends CompileContext {
  /** 首次解析访问时登记依赖。 */
  activate(value: Value, location?: CompileContext): void
  resolving: Set<object>
  conditions?: ValueConditions
  /** 在消费位置补充条件变量默认值，显式声明优先。 */
  defineVariable(name: string, values: ValueResult[], location: CompileContext): void
  /** 承接作为完整声明内容的 Rules。 */
  visitRules?: (rules: Rules, conditions: ValueConditions) => void
}

/** 逐个解析组成部分，保留全部组合与条件贡献。 */
function compileParts(parts: ValueInput[], context: ValueContext, conditions: ValueConditions, format: (parts: string[]) => string): ValueResult[] {
  let states: { conditions: ValueConditions; parts: string[] }[] = [{ conditions, parts: [] }]
  for (const part of parts) {
    states = states.flatMap((state) => expandValue(part, context, state.conditions).map((result) => ({
      conditions: result.conditions, parts: [...state.parts, result.text],
    })))
  }
  return states.map((state) => ({ conditions: state.conditions, text: format(state.parts) }))
}

/** 解析声明组成部分的全部候选。 */
export function compileValueParts(parts: ValueInput[], context: ValueContext, format: (parts: string[]) => string): ValueResult[] {
  return compileParts(parts, context, context.conditions ?? [], format)
}

/** 编译复合表达；Variable 的条件只改变自身定义。 */
function compileExpression(expression: ValueExpression, context: ValueContext, conditions: ValueConditions): ValueResult[] {
  /** 组合子值候选。 */
  const compose = (parts: ValueInput[], format: (parts: string[]) => string) => compileParts(parts, context, conditions, format)
  switch (expression.type) {
    case 'variable': {
      if (expression.fallback === undefined) return [{ conditions, text: `var(--${expression.name})` }]
      const fallback = expandValue(expression.fallback, { ...context, visitRules: undefined }, [])
      const base = fallback.find((entry) => valueConditionPath(entry.conditions).length === 0)
      if (!base) throw new Error('Variable 缺少可解析的 default。')
      if (fallback.some((entry) => valueConditionPath(entry.conditions).length > 0)) {
        context.defineVariable(expression.name, fallback, context)
      }
      return [{ conditions, text: `var(--${expression.name}, ${base.text})` }]
    }
    case 'list': return compose(expression.items, (parts) => parts.join(', '))
    case 'product': return compose([expression.amount, expression.factor], ([amount, factor]) => `calc(${amount} * ${factor})`)
    case 'function': return compose(expression.arguments, (parts) => `${expression.name}(${parts.join(', ')})`)
    case 'animation': return compose([expression.name, expression.duration, expression.easing, expression.delay, expression.iterations, expression.direction, expression.fillMode, expression.playState].filter((part) => part !== undefined), (parts) => parts.join(' '))
    case 'color-mix': {
      const parts = expression.colors.flatMap((part) => Array.isArray(part) ? part : [part])
      return compose(parts, (values) => {
        let index = 0
        const colors = expression.colors.map((part) => {
          const color = values[index++]
          if (!Array.isArray(part)) return color
          const ratio = values[index++]
          const percentage = Number.isFinite(Number(ratio)) ? `${Number(ratio) * 100}%` : `calc(${ratio} * 100%)`
          return `${color} ${percentage}`
        })
        return `color-mix(in oklab, ${colors.join(', ')})`
      })
    }
    case 'shadow': {
      const parts = [expression.x, expression.y]
      if (expression.blur !== undefined || expression.spread !== undefined) parts.push(expression.blur ?? '0')
      if (expression.spread !== undefined) parts.push(expression.spread)
      if (expression.color !== undefined) parts.push(expression.color)
      return compose(parts, (values) => `${expression.inset ? 'inset ' : ''}${values.join(' ')}`)
    }
  }
}

/** 展开每个 Value 的单分支候选；未知名称与递归引用报错。 */
function expandValue(input: ValueInput, context: ValueContext, conditions: ValueConditions): ValueResult[] {
  if (typeof input !== 'object') return [{ conditions, text: String(input) }]
  if (context.resolving.has(input)) throw new Error('Value 内容存在循环引用，无法生成 CSS。')
  context.resolving.add(input)
  try {
    if (input instanceof Map) {
      if (context.visitRules) {
        context.visitRules(input, conditions)
        return []
      }
      const results: ValueResult[] = []
      for (const [[path, property], child] of input) {
        if (property !== undefined || isCSSPair(child)) throw new Error('复合 Value 内的规则不能切换声明 Key。')
        results.push(...expandValue(child, context, path === undefined ? conditions : [...conditions, path]))
      }
      return results
    }
    context.activate(input, { ...context, path: [...context.path, ...valueConditionPath(conditions)] })
    if (input.default !== undefined) {
      if (input.conditions.length === 0) return expandValue(input.default, context, conditions)
      const branches = new Map(input.conditions)
      const definitions = resolveSubjectConditions([...branches.keys()])
      return [
        ...expandValue(input.default, context, conditions),
        ...definitions.flatMap(({ name }) => expandValue(branches.get(name)!, context, [...conditions, name])),
      ]
    }
    return compileExpression(input.expression, { ...context, visitRules: undefined }, conditions)
  } finally {
    context.resolving.delete(input)
  }
}

/** 解析值的全部候选；不校验条件或挂载声明。 */
export function compileValue(input: ValueInput, context: ValueContext, conditions = context.conditions ?? []): ValueResult[] {
  return expandValue(input, context, conditions)
}
