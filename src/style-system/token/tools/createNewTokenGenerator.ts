/** 为 Token 名称补充前缀，并统一管理定义地址。 */
import {
  token,
  createTokenDefinition,
  type Token,
  type TokenAddress,
  type TokenData,
  type TokenOptions,
} from '../core'
import type { TokenDefaultInput } from '../args-parser'

/** 调用处只配置值及状态等内容，名称和地址由生成器管理。 */
type ManagedTokenOptions<T extends TokenData> = TokenOptions<T> & {
  name?: never
  address?: never
}

/** 保留 Token 创建与泛型推导，同时禁止指定 CSS 名称和定义地址。 */
interface ManagedTokenGenerator {
  <T extends TokenData, U extends TokenData>(
    input: Token<T>,
    options: ManagedTokenOptions<U> & { default: U },
  ): Token<U>
  <T extends TokenData>(
    input: Token<T>,
    options?: ManagedTokenOptions<Token<T>>,
  ): Token<Token<T>>
  (input: number, options?: ManagedTokenOptions<number>): Token<number>
  (input: string, options?: ManagedTokenOptions<string>): Token<string>
  <T extends TokenData>(
    input: T & TokenDefaultInput<T>,
    options?: ManagedTokenOptions<T>,
  ): Token<T>
}

/**
 * 创建统一定义地址的 Token 生成器；名称保留前缀和可用来源名，末尾自动分配唯一标识。
 * 未配置地址时随消费位置发布，不继承来源地址。
 */
export function createNewTokenGenerator(config: {
  /** 仅附在名称之前；显式 name 替代来源名与自动标识时，前缀仍保留。 */
  prefixName: string
  address?: TokenAddress
}): ManagedTokenGenerator {
  const { prefixName, address } = config
  return ((
    input: Parameters<typeof token>[0],
    options?: ManagedTokenOptions<TokenData> & { default?: TokenData },
  ) =>
    createTokenDefinition<TokenData>(
      input,
      { ...options, address },
      prefixName,
    )) as ManagedTokenGenerator
}
