/** Variable 领域的公开契约。
 *
 * 公开创建、引用及操作入口需要的声明和修改消费能力。
 *
 * 内部声明归属、步骤和消费账本由领域成员自行维护，不随入口暴露。
 */
export { variable, variableFrom, isVariable, referenceVariable, compileVariableContent } from './core'
export type { Variable, VariableOptions, VariableDefaultValue, VariableStateRule, VariableVariantRule, VariableTarget, VariableFromName, VariableAddress } from './core'
export type { VariableStateValues } from './args-parser'
export { declareVariable } from './declare'
export { compileVariableModification } from './modify'

export { variableName } from './name'
export type { VariableName } from './name'
