/** CSS 自定义函数的调用与按需定义。 */
import { cssContent } from '../../../value'
import { functionDefinition } from '../../../condition'
import type { Rules } from '../../../rule'
import type { CSSFunction, ValueInput } from '../../../value'

/** 创建调用工厂；使用时提供函数定义。 */
export function cssFunction(signature: string, body: Rules): (...args: ValueInput[]) => CSSFunction {
  const name = signature.split('(')[0].trim()
  const definition: Rules = [[[functionDefinition(signature)], undefined, body]]
  return (...args) => Object.assign(
    cssContent((read: Parameters<CSSFunction>[0]) => {
      const parts = args.map(read)
      return parts.some((part) => part === undefined) ? undefined : `${name}(${parts.join(', ')})`
    }),
    { onActive: () => definition },
  )
}
