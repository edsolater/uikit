/** 独立修改规则的描述与 JS 调整入口。 */
import { assert, containKey, isFinite, isFunction } from '@edsolater/fnkit'
import { evaluateExpression, isEvaluableExpression, type Expression } from './content'
import { isValue, value, type ValueData, type ValueInput } from './value'
import { isVariable, type Variable } from './variable'
import { resolveVariable } from './variable-cluster'
import { applyColorChannel, type ColorModification } from './pieces/contents/functions/color-modification'

/** 修改规则的内部描述协议；执行由 modify 或 adjust 负责。 */
export const modificationRule = Symbol('modification-rule')

export type ModificationRule = ((currentExpression: Expression) => Expression) | ColorModification

/** 保存 Expression 回调或具名颜色规则，不是可输出的 CSS 内容。 */
export interface Modification {
  [modificationRule]: ModificationRule
}

/** 判断对象是否保存修改规则，不执行回调。 */
export const isModification = (input: unknown): input is Modification => containKey(input, modificationRule)

/** 沿默认来源取得实际数据载体，保留其格式器，不执行生产函数。 */
const readVariableDefault = (input: unknown): unknown =>
  isVariable(input)
    ? readVariableDefault(resolveVariable(input).config.defaultValue)
    : input

/** 读取直接持有的 JS 内容，不调用生产函数或浏览器。 */
export function readJSValue(input: unknown): unknown {
  const current = readVariableDefault(input)
  return isValue(current) ? readJSValue(current.content) : current
}

/** JS 算术只接受可直接求值的有限数值；CSS 单位和 CSS 状态留给浏览器。 */
export function readNumber(input: unknown): number {
  const raw = readJSValue(input)
  const number = isEvaluableExpression(raw)
    ? raw[evaluateExpression]()
    : raw
  assert(isFinite(number), '此表达式没有可直接求值的有限 JS 数值。')
  return number
}

/**
 * 构造表达式修改规则；CSS 接受任意内容表达式，JS 应用求值已知数值算术。
 * @example
 * const increase = modification(currentExpression => add(currentExpression, 2))
 * adjust(amount, increase) // 直接修改 amount 的 JS 基础值
 * rules(['.item', '&:hover'], [modify(amount, increase)]) // 浏览器条件下应用
 */
export const modification = (change: (currentExpression: Expression) => Expression): Modification => ({ [modificationRule]: change })

/**
 * 直接修改目标 Variable 的 JS 基础内容；状态内容和 CSS 注册保持各自含义。
 * 生产函数与只有 CSS 表达式的来源没有可直接修改的 JS 值。
 * @example
 * const surface = variable(oklch({ lightness: 0.5, chroma: 0.1, hue: 240 }))
 * adjust(surface, colorModification({ lightness: currentExpression => add(currentExpression, 0.1) }))
 * // surface 仍是同一个 Variable，下一次编译读取明度 0.6。
 */
export function adjust(target: Variable, change: Modification): Variable {
  const variable = resolveVariable(target)
  const rule = change[modificationRule]
  /** 保留原 Value 包装和格式器，只在实际 JS 数据处执行规则。 */
  const updateContent = (input: unknown): unknown => {
    const original = readVariableDefault(input)
    assert(!isFunction(original), 'adjust 不求值基础生产函数；请提供直接持有的 JS 内容。')
    if (isValue(original))
      return original.withContent(updateContent(original.content) as ValueData)
    if (isFunction(rule)) return readNumber(rule(value(original as ValueData)))
    assert(
      containKey(original, 'lightness', 'chroma', 'hue'),
      '颜色修改需要直接持有的 OKLCH 通道，不能从 CSS 字符串反求颜色。',
    )
    const next = { ...original }
    for (const name of ['lightness', 'chroma', 'hue', 'alpha'] as const) {
      const channel = rule[name]
      if (channel !== undefined)
        next[name] = readNumber(
          applyColorChannel(channel, value(name === 'alpha' ? (original[name] ?? 1) : original[name])),
        )
      else if (containKey(original, name)) next[name] = original[name]
    }
    return next
  }
  variable.config.defaultValue = updateContent(variable.config.defaultValue) as ValueInput
  return target
}
