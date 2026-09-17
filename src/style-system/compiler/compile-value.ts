/** 编译时按请求 Condition Path 逐层取值；当前访问链负责检测循环。 */
import type { ConditionPath } from '../core/css-condition'
import type { CompileContext, Value, ValueInput, ValueExpression } from '../core/css-value'
import { variableName } from '../core/css-variable'

/** 一个 Value 在某条相对 Condition Path 下的已编译 CSS 文本，等待与外层 Rule 地址合并。 */
export interface ValueResult { path: ConditionPath; text: string }

/**
 * 连接值读取与当前编译会话：activate 接管依赖激活，resolving 记录尚未退出的取值链。
 * 本文件后续示例沿用下面的 context；示例值均无 onActive，因此 activate 可以为空操作。
 * 正式编译由 compileRules 提供 activate，负责每个对象只激活一次并收集返回的 Rules，不能用此空操作替代。
 * @example
 * const context: ValueContext = {
 *   root: new Map(),
 *   path: [],
 *   resolving: new Map(),
 *   activate() {},
 * }
 * compileAt('red', [], context) // 'red'；读取完成后 context.resolving 仍为空。
 */
export interface ValueContext extends CompileContext {
  /** 将首次访问的对象值交给当前编译会话激活；location 缺省时使用当前消费位置。 */
  activate(value: Value, location?: CompileContext): void
  /** 当前访问链上的对象及实际取值属性；调用结束后移除，不作为跨调用缓存。 */
  resolving: Map<object, Set<string>>
}

/**
 * 把有序 Condition name 编码为可比较的地址 Key；CSS 块头不同但 name 相同的路径仍属于同一地址。
 * @example conditionPathKey([condition('&:hover', 'hover')]) // '["hover"]'
 */
export function conditionPathKey(path: ConditionPath): string {
  return JSON.stringify(path.map((item) => item.name))
}

/**
 * 组合各部分的条件及其交集，再把每部分最后一个适用结果交给 format。
 * 路径按部分输入顺序连接；完全相同的路径不重复连接，缺少任一部分的路径不输出。
 * 返回路径仍相对消费位置，不改写外层 Rule 地址。
 * @example
 * const hover = condition('&:hover')
 * combineValues([
 *   [{ path: [], text: 'red' }, { path: [hover], text: 'blue' }],
 *   [{ path: [], text: '1px' }],
 * ], (parts) => parts.join(' '))
 * // [{ path: [], text: 'red 1px' }, { path: [hover], text: 'blue 1px' }]
 */
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

/**
 * 判断 key 是否按原顺序包含在 path 中；中间允许其他 Condition，空路径始终适用。
 * @example
 * const hover = condition('&:hover'), active = condition('&:active'), wide = condition('@media (width > 600px)')
 * includesPath([hover, wide, active], [hover, active]) // true
 * includesPath([hover, active], [active, hover]) // false
 */
function includesPath(path: ConditionPath, key: ConditionPath): boolean {
  let offset = 0
  return key.every((item) => {
    const index = path.findIndex((candidate, index) => index >= offset && candidate.name === item.name)
    offset = index + 1
    return index !== -1
  })
}

/**
 * 提取参与条件传播的子值；保留 CSS 语法顺序，忽略缺省字段及混色比例等元数据。
 * 不编译子值，也不触发 onActive。
 * @example
 * expressionParts({ type: 'color-mix', colors: [['red', 0.2], 'blue'] }) // ['red', 'blue']
 */
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

/**
 * 收集当前值需要输出的相对路径：继承 default 的路径，再加入自身 Condition；复合值包含组成路径的交集。
 * Condition 对应值的其他路径不向外传播，Rules 只读取本层地址，不触发 onActive。
 * 此处遇到当前链已访问对象便停止探查；真正取值时再由 resolveValue/compileAt 判定循环并报错。
 * @example
 * const hover = condition('&:hover'), active = condition('&:active')
 * valuePaths(value(value('red', [[hover, 'blue']]), [[active, 'green']]))
 * // [[], [hover], [active]]
 */
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

/**
 * 按 requested 逐层读取 Value：有同路径 Condition 就取最后一个对应值，否则取 default。
 * 请求路径保持不变；到达原始值、Rules 或复合表达时交给 consume，其结果原样返回。
 * 访问时激活 Value；当前链重复读取同一对象的同一实际属性才报循环，consume 完成后退出访问链。
 * consume 的 exactKey 表示途中是否命中过同路径 Condition，供复合值决定如何向子值传递请求。
 * @example
 * const hover = condition('&:hover'), active = condition('&:active')
 * const nested = value('red', [[hover, value('blue', [[hover, 'cyan']])]])
 * resolveValue(nested, [hover], context, (resolved) => resolved) // 'cyan'
 * resolveValue(nested, [active], context, (resolved) => resolved) // 'red'
 */
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

/**
 * 为一个请求路径生成值文本，不附加选择器、属性名或大括号；递归读取过程中触发可达值的 onActive。
 * exactKey 表示外层已显式命中该路径，子值必须继续按完整请求取值。
 * Variable 的 fallback 定义了请求路径时读取对应派生名称，否则读取基础名称。
 * Rules 在这里作为值使用，只允许无属性条目；取最后一个适用条目，没有可用值或发生当前链循环时抛错。
 * @example
 * const hover = condition('&:hover')
 * compileAt(value('red', [[hover, 'blue']]), [hover], context) // 'blue'
 * compileAt(valueList('red', 'blue'), [], context) // 'red, blue'
 */
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
          if (property !== undefined || (typeof child === 'object' && !(child instanceof Map) && child.kind === 'declaration')) throw new Error('复合 Value 内的规则不能切换声明属性。')
          if (includesPath(requested, path ?? [])) selected = child
        }
        if (selected === undefined) throw new Error('Value 缺少可解析的 default。')
        return compileAt(selected, requested, context, exactKey || selectedKey)
      }
      context.activate(resolved, context)
      const expression = resolved.expression!
      /**
       * 编译当前复合表达的一部分；显式命中的完整路径继续下传，否则取该部分最后一个适用路径。
       * @example
       * const hover = condition('&:hover'), active = condition('&:active')
       * // 当前请求为 [hover, active]，交集由两个组成部分产生，未显式命中完整路径。
       * compileChild(value('red', [[hover, 'blue']])) // 'blue'
       * // 若 exactKey 为 true，同一子值没有完整路径 [hover, active]，结果为 'red'。
       */
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

/**
 * 生成值的全部路径与文本；返回路径相对消费位置，onActive 收到的路径则包含 context.path。
 * 不写 Rule 账本或 DOM；取值失败直接向调用方抛出。
 * @example
 * const hover = condition('&:hover')
 * compileValue(value('red', [[hover, 'blue']]), context)
 * // [{ path: [], text: 'red' }, { path: [hover], text: 'blue' }]
 */
export function compileValue(input: ValueInput, context: ValueContext): ValueResult[] {
  return valuePaths(input).map((path) => ({ path, text: compileAt(input, path, { ...context, path: [...context.path, ...path] }) }))
}
