/** Value 包装并连接一份业务内容。 */
import type { JSSContent, JSSContentReader } from './content'

export type ValueOptions = Pick<JSSContent, 'onActive'>

/** Value 只包装内容，不选择或传播状态。 */
export interface Value extends JSSContent {
  kind: 'value'
  content: ValueInput
  contents: ValueInput[]
  toCSSString(read?: JSSContentReader): string | undefined
}
export type ValueInput = string | number | JSSContent | undefined

/** 包装稳定内容及其按需依赖。 */
export function value(content: ValueInput, options?: ValueOptions): Value {
  const result = {
    kind: 'value' as const,
    content,
    ...options,
    get contents(): ValueInput[] { return result.content === undefined ? [] : [result.content] },
    toCSSString(read?: JSSContentReader): string | undefined {
      return result.content === undefined ? undefined : read?.(result.content)
    },
  }
  return result
}
