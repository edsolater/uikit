/** Condition Value 的路径发现、读取与编译。 */
import type { ConditionPath } from '../core/css-condition'
import { isCSSPair } from '../core/css-declaration'
import type { CompileContext, Value, ValueInput, ValueExpression } from '../core/css-value'
import { variableName } from '../core/css-variable'

/** 一项带相对路径的值结果。 */
export interface ValueResult { path: ConditionPath; text: string }

/** Value 读取与当前编译会话的连接。 */
export interface ValueContext extends CompileContext {
  /** 激活首次访问的对象值。 */
  activate(value: Value, location?: CompileContext): void
  /** 当前访问链中的对象槽位。 */
  resolving: Map<object, Set<string>>
}

/** 把 Condition header 序列编码为地址 Key。 */
export function conditionPathKey(path: ConditionPath): string {
  return JSON.stringify(path.map((item) => item.header))
}

/** 组合各部分的适用路径及交集。 */
export function combineValues(parts: ValueResult[][], format: (parts: string[]) => string): ValueResult[] {
  const paths: ConditionPath[] = [[]]
  for (const part of parts) {
    const known = new Set(paths.map(conditionPathKey))
    const previous = [...paths]
    for (const matched of part) for (const path of previous) {
      const merged = conditionPathKey(path) === conditionPathKey(matched.path) ? path : [...path, ...matched.path]
      const address = conditionPathKey(merged)
      if (!known.has(address)) { known.add(address); paths.push(merged) }
    }
  }
  return paths.flatMap((path) => {
    const values = parts.map((part) => part.findLast((matched) => includesPath(path, matched.path)))
    return values.every((entry) => entry !== undefined)
      ? [{ path, text: format(values.map((entry) => entry!.text)) }] : []
  })
}

/** 判断子路径是否按原顺序包含在目标路径中。 */
function includesPath(path: ConditionPath, key: ConditionPath): boolean {
  let offset = 0
  return key.every((item) => {
    const index = path.findIndex((candidate, index) => index >= offset && candidate.header === item.header)
    offset = index + 1
    return index !== -1
  })
}

/** 取得复合表达中参与 Condition 传播的子值。 */
function expressionParts(expression: ValueExpression): ValueInput[] {
  switch (expression.type) {
    case 'variable': return expression.fallback === undefined ? [] : [expression.fallback]
    case 'list': return expression.items
    case 'product': return [expression.amount, expression.factor]
    case 'function': return expression.arguments
    case 'animation': return [expression.name, expression.duration, expression.easing, expression.delay, expression.iterations, expression.direction, expression.fillMode, expression.playState].filter((part) => part !== undefined)
    case 'color-mix': return expression.colors.map((part) => Array.isArray(part) ? part[0] : part)
    case 'shadow': return [expression.x, expression.y, expression.blur, expression.spread, expression.color].filter((part) => part !== undefined)
  }
}

/** 收集值需要输出的相对 Condition Path，不触发依赖。 */
export function valuePaths(input: ValueInput, visiting = new Set<object>()): ConditionPath[] {
  if (typeof input !== 'object' || visiting.has(input)) return [[]]
  visiting.add(input)
  try {
    if (input instanceof Map) return [...input.keys()].map(([path]) => path ?? [])
    if (input.default !== undefined) {
      const paths = new Map(valuePaths(input.default, visiting).map((path) => [conditionPathKey(path), path]))
      for (const [path] of input.conditions) paths.set(conditionPathKey(path), path)
      return [...paths.values()]
    }
    return combineValues(expressionParts(input.expression).map((part) => valuePaths(part, visiting).map((path) => ({ path, text: '' }))), () => '').map((part) => part.path)
  } finally { visiting.delete(input) }
}

/** 按请求路径读取最后一个匹配分支，否则读取 default；consume 的 exactKey 表示已命中请求路径。 */
export function resolveValue<T>(input: ValueInput, requested: ConditionPath, context: ValueContext, consume: (input: ValueInput, exactKey: boolean) => T): T {
  if (typeof input !== 'object' || input instanceof Map || input.default === undefined) return consume(input, false)
  const requestedKey = conditionPathKey(requested)
  const matched = input.conditions.findLast(([path]) => conditionPathKey(path) === requestedKey)
  const actualKey = matched ? requestedKey : 'default'
  const slots = context.resolving.get(input) ?? new Set<string>()
  if (slots.has(actualKey)) throw new Error('Value 在当前 Condition Path 下存在循环引用，无法生成 CSS。')
  slots.add(actualKey)
  context.resolving.set(input, slots)
  try {
    context.activate(input, context)
    return resolveValue(matched ? matched[1] : input.default, requested, context, (resolved, exactKey) => consume(resolved, exactKey || matched !== undefined))
  } finally {
    slots.delete(actualKey)
    if (!slots.size) context.resolving.delete(input)
  }
}

/** 编译请求路径的值文本；exactKey 要求复合子值继续使用完整请求路径。 */
export function compileAt(input: ValueInput, requested: ConditionPath, context: ValueContext, exactKey = false): string {
  return resolveValue(input, requested, context, (resolved, selectedKey) => {
    if (typeof resolved !== 'object') return String(resolved)
    const slots = context.resolving.get(resolved) ?? new Set<string>()
    const slot = conditionPathKey(requested)
    if (slots.has(slot)) throw new Error('Value 内容存在循环引用，无法生成 CSS。')
    slots.add(slot)
    context.resolving.set(resolved, slots)
    try {
      if (resolved instanceof Map) {
        let selected: ValueInput | undefined
        for (const [[path, property], child] of resolved) {
          if (property !== undefined || isCSSPair(child)) throw new Error('复合 Value 内的规则不能切换声明 Key。')
          if (includesPath(requested, path ?? [])) selected = child
        }
        if (selected === undefined) throw new Error('Value 缺少可解析的 default。')
        return compileAt(selected, requested, context, exactKey || selectedKey)
      }
      context.activate(resolved, context)
      const expression = resolved.expression!
      /** 编译复合表达的一个子值。 */
      const compileChild = (part: ValueInput) => {
        const key = valuePaths(part).findLast((key) => key.length > 0 && includesPath(requested, key)) ?? requested
        return compileAt(part, exactKey || selectedKey ? requested : key, context, exactKey || selectedKey)
      }
      switch (expression.type) {
        case 'variable': {
          const variablePath = expression.fallback === undefined
            ? []
            : valuePaths(expression.fallback).find((path) => conditionPathKey(path) === conditionPathKey(requested)) ?? []
          const name = variableName(expression.name, variablePath)
          return expression.fallback === undefined ? `var(--${name})` : `var(--${name}, ${compileChild(expression.fallback)})`
        }
        case 'list': return expression.items.map(compileChild).join(', ')
        case 'product': return `calc(${compileChild(expression.amount)} * ${compileChild(expression.factor)})`
        case 'function': return `${expression.name}(${expression.arguments.map(compileChild).join(', ')})`
        case 'animation': return expressionParts(expression).map(compileChild).join(' ')
        case 'color-mix': return `color-mix(in oklab, ${expression.colors.map((part) => Array.isArray(part) ? `${compileChild(part[0])} ${part[1] * 100}%` : compileChild(part)).join(', ')})`
        case 'shadow': {
          const parts = [expression.x, expression.y]
          if (expression.blur !== undefined || expression.spread !== undefined) parts.push(expression.blur ?? '0')
          if (expression.spread !== undefined) parts.push(expression.spread)
          if (expression.color !== undefined) parts.push(expression.color)
          return `${expression.inset ? 'inset ' : ''}${parts.map(compileChild).join(' ')}`
        }
      }
    } finally {
      slots.delete(slot)
      if (!slots.size) context.resolving.delete(resolved)
    }
  })
}

/** 编译值的全部路径与文本，不写 Rule 账本或 DOM。 */
export function compileValue(input: ValueInput, context: ValueContext): ValueResult[] {
  return valuePaths(input).map((path) => ({ path, text: compileAt(input, path, { ...context, path: [...context.path, ...path] }) }))
}
