/**
 * 颜色值与相对通道描述的统一入口。
 *
 * 统一返回颜色 Token，颜色描述与 OKLCH 共用通道计算和输出。
 */
import { isObject } from '@edsolater/fnkit'
import { isJSSContent } from '../../content'
import {
  isToken,
  token,
  type Token,
  type TokenInput,
  type TokenData,
  type TokenOptions,
} from '../../token'
import { oklch, type ColorDescription } from './oklch'

export type { ColorDescription } from './oklch'

/** 直接颜色内容，或根据来源调整通道的颜色描述。 */
export type ColorInput = TokenInput | ColorDescription

/**
 * 返回颜色 Token；已有 Token 无配置时复用身份，第二项沿用 Token 配置。
 */
export function color<T extends TokenData, U extends TokenData>(
  input: Token<T>,
  options: TokenOptions<U> & { default: U },
): Token<U>
export function color<T extends TokenData>(
  input: Token<T>,
  options?: undefined,
): Token<T>
export function color<T extends TokenData>(
  input: Token<T>,
  options: string | TokenOptions<Token<T>>,
): Token<Token<T>>
export function color<T extends TokenData>(
  input: Token<T>,
  options?: string | TokenOptions<Token<T>>,
): Token<T> | Token<Token<T>>
export function color(
  input: ColorDescription,
  options?: string | TokenOptions<ColorDescription>,
): Token<ColorDescription>
export function color<T extends TokenInput>(
  input: T,
  options?: string | TokenOptions<T>,
): Token<T>
export function color(input: ColorInput, options?: string | TokenOptions): Token
export function color(
  input: ColorInput,
  options?: string | TokenOptions<never>,
): Token {
  if (isToken(input) && options === undefined) return input
  const configuration = options as string | TokenOptions | undefined
  return isObject(input) && !isJSSContent(input) && 'base' in input
    ? oklch(input, configuration)
    : token(input, configuration)
}
