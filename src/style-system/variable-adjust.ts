/** Variable 的 JS 基础数据调整。
 *
 * 用变化规则计算默认数据，完成求值后创建新 Variable，或在 mutable 模式更新原默认内容。
 *
 * 与条件 CSS 修改分别提供调整入口，保留来源的内容配置和状态，计算失败时不保存结果。
 */
import { assert, containKey, isFunction } from '@edsolater/fnkit'
import type { Expression } from './content'
import type { Modification } from './modification'
import { applyColorChannel, type ColorVariableModification } from './color-variable-modification'
import { readNumber } from './pieces/contents/functions/calc'
import { isValue, value, type ValueData, type ValueInput } from './value'
import { readVariableDefault, variable, type Variable } from './variable'
import { resolveVariable } from './variable-cluster'

/**
 * 按 change 的描述计算目标的 JS 基础数据，返回使用独立匿名 CSS 名称的新 Variable。
 * Cluster 读取默认成员；保留格式器、状态内容与按需行为，不改目标或共享来源。
 * 表达式回调的结果须求得有限数值；颜色变化要求直接持有 OKLCH 通道，未指定的通道保留。
 * 生产函数不执行，CSS 字符串不反求颜色；不支持的数据或求值失败会抛错。
 * @example
 * const surface = variable(oklch({ lightness: 0.5, chroma: 0.1, hue: 240 }))
 * const brighter = adjust(surface, colorVariableModification({ lightness: currentExpression => add(currentExpression, 0.1) }))
 * // surface 明度仍为 0.5，brighter 的基础明度为 0.6；状态内容没有被调整。
 */
export function adjust(target: Variable, change: Modification<((currentExpression: Expression) => Expression) | ColorVariableModification>): Variable

/**
 * 指定 mutable，按 change 的描述算完后更新原目标默认内容，返回原 Variable。
 * Cluster 更新默认成员；共享来源、状态内容和格式器保持，求值失败不改目标内容。
 * @example
 * adjust('mutable', surface, colorVariableModification({ lightness: 0.7 }))
 * // 原 surface 的下一次编译读取基础明度 0.7。
 */
export function adjust<Target extends Variable>(mode: 'mutable', target: Target, change: Modification<((currentExpression: Expression) => Expression) | ColorVariableModification>): Target

/**
 * 完成整条规则求值后才保存结果；失败时保留目标原内容。
 */
export function adjust(...args: [target: Variable, change: Modification<((currentExpression: Expression) => Expression) | ColorVariableModification>] | [mode: 'mutable', target: Variable, change: Modification<((currentExpression: Expression) => Expression) | ColorVariableModification>]): Variable {
  const target = args[0] === 'mutable' ? args[1] : args[0]
  const change = args[0] === 'mutable' ? args[2] : args[1]
  const source = resolveVariable(target)
  /**
   * 展开默认来源，直接计算变化结果，再按原 Value 配置包装。
   */
  const updateContent = (input: unknown): unknown => {
    const original = readVariableDefault(input)
    assert(!isFunction(original), 'adjust 不求值基础生产函数；请提供直接持有的 JS 内容。')
    if (isValue(original))
      return original.withContent(updateContent(original.content) as ValueData)
    if (isFunction(change.change)) return readNumber(change.change(value(original as ValueData)))
    assert(containKey(original, 'lightness', 'chroma', 'hue'),
      '颜色修改需要直接持有的 OKLCH 通道，不能从 CSS 字符串反求颜色。')
    const next = { ...original }
    for (const name of ['lightness', 'chroma', 'hue', 'alpha'] as (keyof ColorVariableModification)[]) {
      const channel = change.change[name]
      if (channel !== undefined)
        next[name] = readNumber(applyColorChannel(channel, value(name === 'alpha' ? (original[name] ?? 1) : original[name])))
      else if (containKey(original, name)) next[name] = original[name]
    }
    return next
  }
  const updated = updateContent(source.config.defaultValue) as ValueInput
  if (args[0] === 'mutable') {
    source.config.defaultValue = updated
    return target
  }
  const options = {
    onActive: source.onActive,
    compileWaveIndex: source.compileWaveIndex,
    registration: source.config.registration ? { ...source.config.registration } : undefined,
  }
  let adjusted = variable(updated, options)
  if (adjusted.name === source.name) adjusted = variable(updated, options)
  adjusted.config.states = new Map(source.config.states)
  return adjusted
}
