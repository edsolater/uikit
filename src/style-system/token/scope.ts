/**
 * 当前同步样式解释的实例写入作用域。
 *
 * 收集真实 Token 的 CSS 标量覆盖，交给原 DOM 样式消费链。
 *
 * 共享定义不保存实例值，嵌套执行和退出后恢复此前作用域。
 */
import type { Token } from './core'
import { cssTokenName } from './css'

/** 实例覆盖只接受最终 CSS 字符串、数字或清除值。 */
export type TokenStyleValue = string | number | undefined

let currentValues: Record<string, TokenStyleValue> | undefined

/**
 * 在当前同步样式解释中写入 Token，不改变共享 default 或状态规则。
 * 调用方必须处于 collectTokenStyles 建立的实例作用域。
 */
export function writeTokenValue(target: Token, value: TokenStyleValue): void {
  currentValues![cssTokenName(target)] = value
}

/**
 * 同步执行本次实例样式解释并返回覆盖；未写入的目标自然恢复样式默认。
 * 解释退出后恢复上层作用域，异常与嵌套执行均不遗留当前实例。
 */
export function collectTokenStyles(
  interpret: () => void,
): Record<string, TokenStyleValue> {
  const previous = currentValues
  const values: Record<string, TokenStyleValue> = {}
  currentValues = values
  try {
    interpret()
    return values
  } finally {
    currentValues = previous
  }
}
