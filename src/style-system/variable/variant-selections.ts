/** 显式用途选择的内部关联账本，供创建与修改消费共用。 */
import type { Variable, VariableTarget } from './core'

export const variantSelections = new WeakMap<VariableTarget, Set<Variable>>()
