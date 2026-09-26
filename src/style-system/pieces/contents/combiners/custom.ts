/** CSS 自定义函数的调用与按需定义。 */
import { createJSSContent } from '../../../content'
import { functionDefinition } from '../../../condition'
import type { Rules } from '../../../rule'
import type { ValueInput } from '../../../value'
import type { JSSContent } from '../../../content'

/** 创建调用工厂；使用时提供函数定义。 */
export function cssFunction(signature: string, body: Rules): (...args: ValueInput[]) => JSSContent {
  const name = signature.split('(')[0].trim()
  const definition: Rules = [[[functionDefinition(signature)], undefined, body]]
  return (...args) => Object.assign(
    createJSSContent((read) => {
      const parts = args.map(read)
      return parts.some((part) => part === undefined) ? undefined : `${name}(${parts.join(', ')})`
    }, args),
    { onActive: () => definition },
  )
}
