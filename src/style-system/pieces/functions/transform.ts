/**
 * 纵轴平移的内容组织。
 *
 * 保留距离输入，延迟生成 translateY 文本。
 *
 * 距离的依赖先由编译器解析，再参与自身输出。
 */
import { token, type Token, type TokenInput } from '../../token'

/**
 * 延迟生成纵轴平移。
 */
export function translateY(distance: TokenInput): Token<TokenInput> {
  return token<TokenInput>(distance, {
    toCSSString: (distance, resolve) => {
      const text = resolve(distance)
      return text === undefined ? undefined : `translateY(${text})`
    },
  })
}
