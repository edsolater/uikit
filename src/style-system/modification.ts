/** 变化描述的保存入口。
 *
 * Modification 持有变化自身的配置或回调，modification 保存表达式变化回调，构造时不执行。
 *
 * 供使用端直接读取变化，具体应用方式由使用端负责。
 */
import type { Expression } from './content'

/** 一份变化描述；Change 决定自身配置或回调的形态。 */
export interface Modification<Change> {
  /** 变化自身的配置或回调。 */
  change: Change
}

/**
 * 保存 change 并返回表达式变化描述；构造时不执行回调。
 * @example
 * const amount = variable(3)
 * const increase = modification(currentExpression => add(currentExpression, 2))
 * const increased = adjust(amount, increase) // 新变量基础值为 5，amount 仍为 3。
 * rules('.item', [declare(amount)])
 * rules(['.item', '&:hover'], [modify(amount, increase)]) // 悬停时局部值加 2。
 */
export const modification = (change: (currentExpression: Expression) => Expression): Modification<(currentExpression: Expression) => Expression> => ({ change })
