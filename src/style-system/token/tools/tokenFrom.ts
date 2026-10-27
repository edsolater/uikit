/** 引用已有 Token 并复用定义配置，追加差异后创建独立 Token。 */
import { token, type Token, type TokenData, type TokenOptions } from '../core'

/** 顶层覆盖定义；state 按条件合并，显式 undefined 清除对应配置。 */
export type TokenFromOptions<T extends TokenData> = TokenOptions<T> & {
  default?: T
}

/**
 * 状态保留原顺序，同条件覆盖，新条件追加；不修改来源定义。
 */
export function tokenFrom<T extends TokenData, U extends TokenData>(
  source: Token<T>,
  additionalOptions: TokenOptions<U> & { default: U },
): Token<U>
export function tokenFrom<T extends TokenData>(
  source: Token<T>,
  additionalOptions?: TokenOptions<Token<T>>,
): Token<Token<T>>
export function tokenFrom<T extends TokenData, U extends TokenData = Token<T>>(
  source: Token<T>,
  additionalOptions: TokenFromOptions<U> = {},
): Token<U> {
  const options = {
    default: source,
    address: source.address,
    state: source.state,
    registration: source.registration,
    onFirstScan: source.onFirstScan,
    compileWaveIndex: source.compileWaveIndex,
    onCompile: source.onCompile,
    ...additionalOptions,
  }
  if (additionalOptions.state !== undefined) {
    const state = additionalOptions.state
    options.state = [
      ...(source.state ?? []),
      ...(Symbol.iterator in state ? state : Object.entries(state)),
    ]
  }
  return token({ default: options.default as U }, options)
}
