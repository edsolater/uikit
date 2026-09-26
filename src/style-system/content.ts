/** JSS 内容在解析与输出时使用的共同约定。 */
import type { ConditionPath } from './condition'
import type { JSSKey } from './key'
import type { Rules } from './rule'
import type { ASTController } from './compiler/style-nodes-to-content-nodes'

/** 输出节点时读取已经解析的子内容。 */
export type JSSContentReader = (content: unknown) => string | undefined

/** 内容被使用时所处的源规则、完整条件地址与声明目标。 */
export interface JSSContentContext {
  root: Rules
  conditionPath: ConditionPath
  key?: JSSKey
}

/** 内容对象按需提供生命周期、解析、子内容与最终输出能力。 */
export interface JSSContent {
  onActive?: (context: JSSContentContext) => Rules | void
  parseWaveIndex?: number
  parse?: (astController: ASTController) => unknown
  contents?: unknown[]
  toCSSString?: (read?: JSSContentReader) => string | undefined
}

/** 连接子内容和输出方法，供业务构造工具及自定义内容使用。 */
export function createJSSContent(
  toCSSString: (read: JSSContentReader) => string | undefined,
  contents: unknown[] = [],
): JSSContent {
  return {
    contents,
    toCSSString: (read) => toCSSString(read ?? (() => undefined)),
  }
}

/** 判断内容对象是否公开解析方法。 */
export function hasJSSContentParser(input: unknown): input is JSSContent & Required<Pick<JSSContent, 'parse'>> {
  return input !== null && (typeof input === 'object' || typeof input === 'function')
    && 'parse' in input && typeof input.parse === 'function'
}

/** 判断内容对象是否公开 CSS 输出方法。 */
export function hasJSSContentOutput(input: unknown): input is JSSContent & Required<Pick<JSSContent, 'toCSSString'>> {
  return input !== null && (typeof input === 'object' || typeof input === 'function')
    && 'toCSSString' in input && typeof input.toCSSString === 'function'
}

/** 判断对象是否承担任一种 JSS 内容行为。 */
export function isJSSContent(input: unknown): input is JSSContent {
  return input !== null && (typeof input === 'object' || typeof input === 'function')
    && (hasJSSContentParser(input) || hasJSSContentOutput(input)
      || ('contents' in input && Array.isArray(input.contents))
      || ('onActive' in input && typeof input.onActive === 'function'))
}
