/**
 * Token 领域的公开入口。
 *
 * 汇集统一定义、创建及参数契约。
 *
 * 让调用方从同一处取得样式值模型。
 */
export * from './core'
export type {
  TokenDefaultInput,
  TokenDefinitionInput,
  TokenStateValues,
  TokenConfig,
} from './args-parser'
export { tokenFrom, type TokenFromOptions } from './tools/tokenFrom'
