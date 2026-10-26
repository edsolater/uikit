/** Token 创建参数的统一入口。
 *
 * 将基础内容、状态简写与命名简写归一为七个固定字段。
 *
 * 后续定义处理不再识别原始调用形式。
 */
import {
  assert,
  isArray,
  isFunction,
  isObject,
  isString,
} from '@edsolater/fnkit'
import { isJSSContent, type JSSContent } from '../content'
import type {
  TokenData,
  TokenDirectInput,
  TokenInput,
  TokenOptions,
  TokenState,
  TokenStateRule,
} from './core'

/** 默认内容中的普通函数是生产器，只能返回内容链可消费的输入。 */
export type TokenDefaultInput<T extends TokenData> = T extends JSSContent
  ? T
  : T extends Function
    ? T extends () => TokenInput
      ? T
      : never
    : T

/** 按完整输入的实际字段推断：default 是数据，其余字段是状态规则。 */
export type TokenDefinitionInput<D extends { default: TokenData }> = D & {
  [K in keyof D]: K extends 'default'
    ? TokenDefaultInput<D['default']>
    : TokenStateRule
}

/** 显式选择默认数据类型的标注；状态的实际合法性仍由 parser 统一验证。 */
export type TokenStateValues<T extends TokenData = TokenData> = {
  default: T
} & Record<string, T | TokenStateRule>

/** 统一创建结果；所有可选字段均保留，未指定地址不自动补成 root。 */
export interface TokenConfig<T extends TokenData = TokenData> {
  default: T
  name: string | undefined
  state: TokenState | undefined
  address: TokenOptions['address']
  registration: TokenOptions['registration']
  onFirstScan: TokenOptions['onFirstScan']
  compileWaveIndex: number
}

/**
 * 归一直接内容、default 状态简写及第二参数名称；不执行基础函数或状态规则。
 * 普通定义对象必须明确提供 default；配置中的同名状态覆盖简写状态。
 */
export function parseTokenArgs<T extends TokenDirectInput>(
  input: T,
  options?: string | TokenOptions<T>,
): TokenConfig<T>
export function parseTokenArgs<D extends { default: TokenData }>(
  input: TokenDefinitionInput<D>,
  options?: string | TokenOptions<D['default']>,
): TokenConfig<D['default']>
export function parseTokenArgs<T extends TokenData = never>(
  input: TokenDirectInput | TokenStateValues<NoInfer<T>>,
  options?: string | TokenOptions<NoInfer<T>>,
): TokenConfig<T>
export function parseTokenArgs<T extends TokenData>(
  input: TokenDirectInput | TokenStateValues<T>,
  options?: string | TokenOptions<T>,
): TokenConfig<T> {
  const config = isString(options) ? { name: options } : (options ?? {})
  const shorthand =
    isObject(input) && !isJSSContent(input)
      ? (input as { default: T })
      : undefined
  if (shorthand)
    assert(
      !isArray(shorthand) && Object.hasOwn(shorthand, 'default'),
      'Token 定义必须提供 default；对象和数组数据请放入 default。',
    )
  const stateEntries = shorthand
    ? Object.entries(shorthand).filter(([name]) => name !== 'default')
    : []
  const states = stateEntries.length
    ? (Object.fromEntries(stateEntries) as TokenState)
    : undefined
  const state =
    states || config.state ? { ...states, ...config.state } : undefined
  for (const rule of Object.values(state ?? {}))
    assert(
      rule === undefined ||
        typeof rule === 'string' ||
        typeof rule === 'number' ||
        isJSSContent(rule) ||
        isFunction(rule),
      'Token 状态必须是可编译内容或状态回调。',
    )
  return {
    default: shorthand ? shorthand.default : (input as T),
    name: config.name,
    state,
    address: config.address,
    registration: config.registration,
    onFirstScan: config.onFirstScan,
    compileWaveIndex: config.compileWaveIndex ?? 0,
  }
}
