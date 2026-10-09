/** 来源、变化与组合结果的绑定。

读取双方天然持有的材料，创建保留 CSS 引用的结果，并共同声明三者。

来源和变化在各自作用域覆盖后，浏览器沿引用计算结果，无需 JS 预先求值。
*/
import { assert, hasProperty, isString, matchShape } from '@edsolater/fnkit'
import type { DeclareProtocol } from './declaration'
import { colorModificationShape, type ColorModificationContent } from './modification'
import { relativeOKLCH } from './pieces/contents/functions/relative-oklch'
import { referenceVariable, variable, type Variable } from './variable'
import { allocateVariableName } from './key'
import { resolveVariable } from './variable-cluster'
import { modifyTargetShape, type ModifyTargetProtocol } from './variable-modify'

/** 调整方交付可声明的配方，type 选择对应的来源组合。 */
export interface AdjustProtocol<Type extends string = string> extends DeclareProtocol {
  type: Type
}

/** 调整目标提供来源声明材料和可选状态、注册信息。 */
export type AdjustTargetProtocol = ModifyTargetProtocol

/**
 * 按 type 绑定来源与配方，返回引用双方的结果；声明和消费结果时共同管理三者依赖。
 * @example
 * const merged = adjust(source, modification({ type: 'color', detail: { alpha: 0.5 } }))
 * rules('.item', [declare(merged), [key('color'), merged]])
 */
export function adjust(source: AdjustTargetProtocol, change: AdjustProtocol<keyof typeof adjustTypes>): Variable {
  assert(hasProperty(source, 'content') && matchShape(source, modifyTargetShape), 'adjust 需要自定义属性的 key/content 来源材料。')
  const combine = hasProperty(change, 'type', isString) && Object.hasOwn(adjustTypes, change.type) ? adjustTypes[change.type] : undefined
  assert(combine !== undefined, 'adjust 需要已支持领域的配方材料。')
  source = resolveVariable(source)
  const expression = combine(source, change)
  for (const target of [source, change]) allocateVariableName(target.key.toCSSString())
  const merged = variable(expression)
  merged.declarations = [source, change]
  return merged
}

/** 当前支持的来源组合；领域细节不进入绑定与共同声明链。 */
const adjustTypes = {
  /**
   * 验证可声明的颜色配方，再以双方 CSS 引用组合相对颜色。
   */
  color: (source: AdjustTargetProtocol, change: ColorModificationContent) => {
    assert(hasProperty(change, 'content') && matchShape(change, colorModificationShape), 'adjust 需要有效的 type/key/content 配方材料。')
    return relativeOKLCH(referenceVariable(source), referenceVariable(change))
  },
}
