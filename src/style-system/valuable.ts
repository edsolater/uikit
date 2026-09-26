/** 可编译内容与按需依赖。 */
import type { ConditionPath } from './condition'
import type { CSSKey } from './css-key'
import type { Rules } from './rule'
import type { ASTController } from './compiler/ast-controller'

/** Content 使用子内容 reader 生成已完成的 CSS 文本。 */
export type CSSContentReader = (content: unknown) => string | undefined

/** 声明内容或 Key 通过自身能力输出 CSS 文本。 */
export interface CSSOutputContent {
  toCSSString(read?: CSSContentReader): string | undefined
}

/** 判断对象是否拥有直接 CSS 输出能力。 */
export function isCSSOutputContent(input: unknown): input is CSSOutputContent {
  return input !== null && (typeof input === 'object' || typeof input === 'function')
    && 'toCSSString' in input && typeof input.toCSSString === 'function'
}

/** 当前消费地址。 */
export interface CompileContext {
  root: Rules
  path: ConditionPath
  key?: CSSKey
}

/** 可被 CSS 化的对象；使用时按需提供根地址依赖。 */
export interface Valuable {
  onActive?: (context: CompileContext) => Rules | void
}

/** Content 通过自身的解析行为接入当前编译队列。 */
export interface ASTParseable {
  parseWaveIndex?: number
  contents?: unknown[]
  parse(astController: ASTController): unknown
}

/** 判断对象是否公开自身解析能力。 */
export function isASTParseable(input: unknown): input is ASTParseable {
  return input !== null && (typeof input === 'object' || typeof input === 'function')
    && 'parse' in input && typeof input.parse === 'function'
}

/** 能被解析或直接输出的 CSS 内容对象。 */
export type CSSContentInput = (Valuable | ASTParseable | CSSOutputContent) & { contents?: unknown[] }
