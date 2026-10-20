/** 完整定义的独立加工。
 *
 * 为来源的默认、状态和变体结果统一应用变化，保留来源本身。
 */
import { assert, hasProperty, isString, matchShape } from '@edsolater/fnkit'
import type { DeclareProtocol } from './declare'
import { colorModificationShape, type ColorModificationContent } from '../modification'
import { oklch } from '../pieces/contents/functions/oklch'
import { referenceVariable, transformVariable, type Variable } from '../variable/core'
import { allocateVariableName } from '../key'
import { modifyTargetShape, type ModifyTargetProtocol } from './modify'
import type { ValueInput } from '../value'

/** 调整方交付可声明的配方，type 选择对应的来源组合。 */
export interface AdjustProtocol<Type extends string = string> extends DeclareProtocol {
  type: Type
}

/** 调整目标提供来源声明材料和可选状态、注册信息。 */
export type AdjustTargetProtocol = ModifyTargetProtocol

/**
 * 从来源创建独立结果，各状态与变体先得到自己的值，再统一应用配方。
 * @example
 * const merged = adjust(source, modification({ type: 'color', detail: { alpha: 0.5 } }))
 * rules('.item', [[key('color'), merged]])
 */
export function adjust(source: AdjustTargetProtocol, change: AdjustProtocol<keyof typeof adjustTypes>): Variable {
  assert(hasProperty(source, 'content') && matchShape(source, modifyTargetShape), 'adjust 需要自定义属性的 key/content 来源材料。')
  const combine = hasProperty(change, 'type', isString) && Object.hasOwn(adjustTypes, change.type) ? adjustTypes[change.type] : undefined
  assert(combine !== undefined, 'adjust 需要已支持领域的配方材料。')
  assert(hasProperty(change, 'content') && matchShape(change, colorModificationShape), 'adjust 需要有效的 type/key/content 配方材料。')
  for (const target of [source, change]) allocateVariableName(target.key.toCSSString())
  return transformVariable(source, current => combine(current, change), allocateVariableName())
}

/** 当前支持的来源组合；领域细节不进入绑定与共同声明链。 */
const adjustTypes = {
  /**
   * 加工各自已经选定的结果，配方仍通过 CSS 引用参与。
   */
  color: (current: ValueInput, change: ColorModificationContent) => oklch(current, referenceVariable(change)),
}
