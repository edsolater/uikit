/** 纵轴平移表达式；距离作为依赖引用，不继承其 Token 定义。 */
import { token, type Token, type TokenInput } from '../../token'

/** 延迟解析距离并生成纵轴平移。 */
export function translateY(distance: TokenInput): Token<[TokenInput]> {
  return token<[TokenInput]>([distance], {
    toCSSString: ([distance], resolve) => {
      const text = resolve(distance)
      return text === undefined ? undefined : `translateY(${text})`
    },
  })
}
