/** 来源、变化与组合结果的绑定。

读取双方天然持有的材料，创建保留 CSS 引用的结果，并共同声明三者。

来源和变化在各自作用域覆盖后，浏览器沿引用计算结果，无需 JS 预先求值。
*/
import { assert, matchShape } from '@edsolater/fnkit'
import { colorModificationShape, type ColorModificationContent } from './modification'
import { relativeOKLCH } from './pieces/contents/functions/relative-oklch'
import { referenceVariable, variable, type Variable } from './variable'
import { allocateVariableName } from './variable-args-parser'
import { resolveVariable } from './variable-cluster'
import { modifyTargetShape, type ModifyTargetProtocol } from './variable-modify'

/** 颜色调整需要可独立声明的源无关配方。 */
export type AdjustProtocol = ColorModificationContent

/** 调整目标提供来源声明材料和可选状态、注册信息。 */
export type AdjustTargetProtocol = ModifyTargetProtocol

/**
 * 绑定来源与颜色配方，返回引用双方的结果；声明和消费结果时共同管理三者依赖。
 * @example
 * const merged = adjust(source, modification({ type: 'color', detail: { alpha: 0.5 } }))
 * rules('.item', [declare(merged), [key('color'), merged]])
 */
export function adjust(source: AdjustTargetProtocol, change: AdjustProtocol): Variable {
  assert(matchShape(source, modifyTargetShape), 'adjust 需要自定义属性的 key/content 来源材料。')
  assert(matchShape(change, colorModificationShape), 'adjust 需要颜色配方的 type/key/content 材料。')
  source = resolveVariable(source)
  for (const target of [source, change]) allocateVariableName(target.key.toCSSString())
  const expression = relativeOKLCH(referenceVariable(source), referenceVariable(change))
  const merged = variable(expression)
  merged.declarations = [source, change]
  return merged
}
