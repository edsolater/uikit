/**
 * Token 创建参数的统一入口。
 *
 * 将基础内容与配置归一为七个固定字段，状态组合统一展开为条目。
 *
 * 后续定义处理不再识别原始调用形式。
 */
import { assert, isArray, isFunction, isString } from '@edsolater/fnkit'
import { isJSSContent, type JSSContent } from '../content'
import type {
  TokenData,
  TokenInput,
  TokenOptions,
  TokenState,
  TokenStateRule,
  TokenStateInput,
} from './core'
import {
  isStateCondition,
  type StateCondition,
  type StateConditionInput,
} from '../state-condition'
import { resolveStateCondition } from '../state-condition-registry'

/** 默认内容中的普通函数是生产器，只能返回内容链可消费的输入。 */
export type TokenDefaultInput<T extends TokenData> = T extends JSSContent
  ? T
  : T extends Function
    ? T extends () => TokenInput
      ? T
      : never
    : T

/** 统一创建结果；所有可选字段均保留，未指定地址不自动补成 root。 */
export interface TokenConfig<T extends TokenData = TokenData> {
  default: T
  name: string | undefined
  state: TokenState | undefined
  /**
   * 显式地址固定发布位置；继承后仍未指定时，需 CSS variable 的定义
   * 在各 AST 使用地址发布 default 和 state。
   * 不写回对象或锁定首处；全局共享须显式指定 root，直接 CSS value 不受影响。
   */
  address: TokenOptions['address']
  registration: TokenOptions['registration']
  onFirstScan: TokenOptions['onFirstScan']
  compileWaveIndex: number
}

/** 归一基础内容及第二参数配置，不执行基础函数或状态规则。 */
export function parseTokenArgs<T extends TokenData>(
  input: T,
  options?: string | TokenOptions<T>,
): TokenConfig<T> {
  const config = isString(options) ? { name: options } : (options ?? {})
  const states = new Map<string, [StateCondition, TokenStateRule]>()
  if (config.state !== undefined)
    for (const [inputCondition, rule] of stateEntries(config.state)) {
      assert(
        typeof inputCondition === 'string' || isStateCondition(inputCondition),
        'Token 状态条件必须是已登记快捷名或 StateCondition。',
      )
      assert(
        rule === undefined ||
          typeof rule === 'string' ||
          typeof rule === 'number' ||
          isJSSContent(rule) ||
          isFunction(rule),
        'Token 状态必须是可编译内容或状态回调。',
      )
      const resolved = resolveStateCondition(inputCondition)
      states.set(resolved.header, [resolved, rule])
    }
  return {
    default: input,
    name: config.name,
    state: config.state === undefined ? undefined : new Map(states.values()),
    address: config.address,
    registration: config.registration,
    onFirstScan: config.onFirstScan,
    compileWaveIndex: config.compileWaveIndex ?? 0,
  }
}

/** 递归展开状态组合，条件与规则的二元组始终作为一个条目保留。 */
function* stateEntries(
  source: TokenStateInput,
): Generator<readonly [StateConditionInput, TokenStateRule]> {
  if (
    isArray(source) &&
    source.length === 2 &&
    (typeof source[0] === 'string' || isStateCondition(source[0]))
  ) {
    yield [source[0], source[1]]
  } else if (Symbol.iterator in source) {
    for (const child of source as Iterable<TokenStateInput>)
      yield* stateEntries(child)
  } else {
    yield* Object.entries(source)
  }
}
