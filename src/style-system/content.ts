/** 定义 CSS 内容被消费、解析和输出时的行为。 */
import { hasProperty, isArray, isFunction } from '@edsolater/fnkit'
import type { ConditionPath } from './condition'
import type { JSSKey } from './key'
import type { Rules } from './rule'
import type { ASTController } from './compiler/ast-controller'

/** 输出节点时读取已经解析的子内容。 */
export type JSSContentReader = (content: unknown) => string | undefined

/** 内容被激活时的编译位置。 */
export interface JSSContentContext {
  /** 本次编译的源 Rules。 */
  root: Rules
  /** 当前声明的完整条件地址。 */
  conditionPath: ConditionPath
  /** 当前声明的目标；无目标时省略。 */
  key?: JSSKey
}

/** 可按需提供依赖规则、解析结果或 CSS 输出的内容对象。 */
export interface JSSContent {
  /** 按需 Rules 中需要独立保留的内容，可显式声明资源身份。 */
  resourceIdentity?: string | symbol
  /** 首次被消费时提供按需 Rules；本次编译的其他消费者共享其产物。 */
  onActive?: (context: JSSContentContext) => Rules | void
  /** parse 最早可执行的解析波，省略为第 0 波。 */
  parseWaveIndex?: number
  /** 编译时解析内容；readState 沿返回值与子内容传递，返回值继续解析。 */
  parse?: (astController: ASTController, readState?: string) => unknown
  /** 随本对象一起解析的子内容。 */
  contents?: unknown[]
  /** 输出 CSS 文本；read 可读取已经解析的子内容。 */
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
  return hasProperty(input, 'parse', isFunction)
}

/** 判断内容对象是否公开 CSS 输出方法。 */
export function hasJSSContentOutput(input: unknown): input is JSSContent & Required<Pick<JSSContent, 'toCSSString'>> {
  return hasProperty(input, 'toCSSString', isFunction)
}

/** 判断对象是否承担任一种 JSS 内容行为。 */
export function isJSSContent(input: unknown): input is JSSContent {
  return (
    hasJSSContentParser(input) ||
    hasJSSContentOutput(input) ||
    hasProperty(input, 'contents', isArray) ||
    hasProperty(input, 'onActive', isFunction)
  )
}
