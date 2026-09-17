/** 从消费地址向叶子编译 Value 与 CSS Function。 */
import { conditionPathKey, mergeConditionBranch, type ConditionBranch, type ConditionPath } from '../core/css-condition'
import { isCSSPair } from '../core/css-declaration'
import type { Rules } from '../core/css-rule'
import type { CompileContext, Value, ValueInput, ValueExpression } from '../core/css-value'

/** 一项带相对路径的值结果。 */
export interface ValueResult { path: ConditionPath; text: string }

/** 当前值分支；未选择分支与 default 分支分别保留。 */
interface ValueBranch { branch: ConditionBranch; text: string }

/** Value 与本次编译会话的连接。 */
export interface ValueContext extends CompileContext {
  activate(value: Value, location?: CompileContext): void
  resolving: Map<object, Set<string>>
  /** 在消费位置补充条件变量默认值，显式声明优先。 */
  defineVariable(name: string, values: ValueResult[], location: CompileContext): void
  /** 承接作为完整声明内容的 Rules。 */
  visitRules?: (rules: Rules, path: ConditionPath) => void
}

/** 顺着当前分支编译各组成部分，再格式化完整值。 */
function compileParts(parts: ValueInput[], context: ValueContext, branch: ConditionBranch, format: (parts: string[]) => string): ValueBranch[] {
  let states: { branch: ConditionBranch; parts: string[] }[] = [{ branch, parts: [] }]
  for (const part of parts) {
    states = states.flatMap((state) => expandValue(part, context, state.branch).map((result) => ({
      branch: result.branch, parts: [...state.parts, result.text],
    })))
  }
  return states.map((state) => ({ branch: state.branch, text: format(state.parts) }))
}

/** 编译一组共享临时地址的声明内容。 */
export function compileValueParts(parts: ValueInput[], context: ValueContext, format: (parts: string[]) => string): ValueResult[] {
  return compileParts(parts, context, undefined, format).map(({ branch, text }) => ({ path: branch ?? [], text }))
}

/** 编译复合表达；Variable 的条件只改变自身定义。 */
function compileExpression(expression: ValueExpression, context: ValueContext, branch: ConditionBranch): ValueBranch[] {
  /** 沿当前分支组合子值。 */
  const compose = (parts: ValueInput[], format: (parts: string[]) => string) => compileParts(parts, context, branch, format)
  switch (expression.type) {
    case 'variable': {
      if (expression.fallback === undefined) return [{ branch, text: `var(--${expression.name})` }]
      const location = { ...context, path: [...context.path, ...(branch ?? [])] }
      const fallback = expandValue(expression.fallback, { ...context, path: location.path, visitRules: undefined }, undefined)
      const base = fallback.find((entry) => !entry.branch?.length)
      if (!base) throw new Error('Variable 缺少可解析的 default。')
      if (fallback.some((entry) => entry.branch?.length)) {
        context.defineVariable(expression.name, fallback.map((entry) => ({ path: entry.branch ?? [], text: entry.text })), location)
      }
      return [{ branch, text: `var(--${expression.name}, ${base.text})` }]
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

/** 展开当前 Value；不相容分支退出，递归引用报错。 */
function expandValue(input: ValueInput, context: ValueContext, branch: ConditionBranch): ValueBranch[] {
  if (typeof input !== 'object') return [{ branch, text: String(input) }]
  const slot = branch === undefined ? 'unselected' : conditionPathKey(branch)
  const slots = context.resolving.get(input) ?? new Set<string>()
  if (slots.has(slot)) throw new Error('Value 在当前 Condition Path 下存在循环引用，无法生成 CSS。')
  slots.add(slot)
  context.resolving.set(input, slots)
  try {
    if (input instanceof Map) {
      if (context.visitRules) {
        context.visitRules(input, [...context.path, ...(branch ?? [])])
        return []
      }
      const results = new Map<string, ValueBranch>()
      for (const [[path, property], child] of input) {
        if (property !== undefined || isCSSPair(child)) throw new Error('复合 Value 内的规则不能切换声明 Key。')
        const next = path === undefined ? branch : mergeConditionBranch(branch, path)
        if (next === null) continue
        for (const result of expandValue(child, context, next)) results.set(JSON.stringify(result.branch), result)
      }
      return [...results.values()]
    }
    context.activate(input, { ...context, path: [...context.path, ...(branch ?? [])] })
    if (input.default !== undefined) {
      if (input.conditions.length === 0) return expandValue(input.default, context, branch)
      const branches = new Map<string, [ConditionPath, ValueInput]>([[conditionPathKey([]), [[], input.default]]])
      for (const [path, child] of input.conditions) branches.set(conditionPathKey(path), [path, child])
      return [...branches.values()].flatMap(([path, child]) => {
        const next = mergeConditionBranch(branch, path)
        return next === null ? [] : expandValue(child, context, next)
      })
    }
    return compileExpression(input.expression, { ...context, visitRules: undefined }, branch)
  } finally {
    slots.delete(slot)
    if (!slots.size) context.resolving.delete(input)
  }
}

/** 编译值的有效分支与文本；已有分支继续约束子值。 */
export function compileValue(input: ValueInput, context: ValueContext, branch?: ConditionPath): ValueResult[] {
  return expandValue(input, context, branch).map(({ branch, text }) => ({ path: branch ?? [], text }))
}
