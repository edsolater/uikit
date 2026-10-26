/** JSS 内容与表达式的消费协议。
 *
 * 定义广义生命周期、子内容解析与纯内容表达式的输出边界。
 *
 * 让编译器消费对象能力，同时让内容组织工具保持自身职责。
 */
import { assert, isObjectLike, isArray, isFunction, isNullish } from '@edsolater/fnkit'
import type { ConditionPath } from './condition'
import type { JSSKey } from './key'
import type { Rules } from './rule'
import type { JSSStyleNode, ASTController } from './compiler/contracts'

/** 输出节点时取得已经编译的子内容。 */
export type JSSContentResolver = (content: unknown) => string | undefined

/** 对象首次被扫描到时的编译位置。 */
export interface JSSContentContext {
  /** 本次编译的源 Rules。 */
  root: Rules
  /** 当前声明的完整条件地址。 */
  conditionPath: ConditionPath
  /** 当前声明的目标；无目标时省略。 */
  key?: JSSKey
}

/** 一次声明角色访问的输入快照；node 保留可改写的原节点引用。 */
export interface JSSCompileContext {
  node: JSSStyleNode
  /** 此次通知的内容对象；嵌套内容各自取得自己的输入身份。 */
  input: JSSContent
  /** 本次编译的不透明稳定身份，供消费者保存私有状态。 */
  session: object
  conditionPath: ConditionPath
  key: JSSKey | undefined
  content: unknown
  role: 'declaration-key' | 'declaration-content'
}

/** 内容协议的能力字段；实际内容至少提供其中一种处理或输出能力。 */
export interface JSSContentProtocol {
  /** 按需 Rules 中需要独立保留的内容，可显式声明资源身份。 */
  resourceIdentity?: string | symbol
  /** 同一对象每次编译首次扫描时提供按需 Rules；其他消费者共享其产物。 */
  onFirstScan?: (context: JSSContentContext) => Rules | void
  /** 最早执行 onCompile 的编译波，省略为第 0 波。 */
  compileWaveIndex?: number
  /** 同一对象每次编译只通知一次；通过 Controller 操作内容与队列，不使用返回值。 */
  onCompile?: (context: JSSCompileContext, ast: ASTController) => void
  /** 随本对象一起编译的依赖内容。 */
  dependencies?: unknown[]
  /** 输出 CSS 文本；resolve 可取得已经编译的子内容。 */
  toCSSString?: (resolve?: JSSContentResolver) => string | undefined
}

/** 至少具有一种实际内容能力的对象；与 isJSSContent 的识别范围一致。 */
export type JSSContent = JSSContentProtocol & (
  Required<Pick<JSSContentProtocol, 'onCompile'>> | Required<Pick<JSSContentProtocol, 'onFirstScan'>>
  | Required<Pick<JSSContentProtocol, 'toCSSString'>> | Required<Pick<JSSContentProtocol, 'dependencies'>>
)

/** 只组织自身依赖与 CSS 输出的表达式；自身不承担消费位置、AST 操作或资源定义。 */
export interface Expression extends JSSContentProtocol {
  dependencies: unknown[]
  toCSSString(resolve?: JSSContentResolver): string | undefined
  onFirstScan?: never
  onCompile?: never
  compileWaveIndex?: never
  resourceIdentity?: never
}

/**
 * 连接依赖内容和输出方法，构造自身没有编译或激活行为的 Expression。
 */
export const createJSSContent = (
  toCSSString: (resolve: JSSContentResolver) => string | undefined,
  dependencies: unknown[] = [],
): Expression => ({
  dependencies,
  toCSSString: (resolve) => toCSSString(resolve ?? (() => undefined)),
})

/**
 * 判断内容对象是否提供 onCompile 方法，接受继承方法及可调用内容对象。
 */
export const hasJSSContentOnCompileMethod = (input: unknown): input is JSSContent & Required<Pick<JSSContent, 'onCompile'>> =>
  isObjectLike(input) && 'onCompile' in input && isFunction(input.onCompile)

/**
 * 判断内容对象是否公开 CSS 输出方法。
 */
export const hasJSSContentOutput = (input: unknown): input is JSSContent & Required<Pick<JSSContent, 'toCSSString'>> =>
  isObjectLike(input) && 'toCSSString' in input && isFunction(input.toCSSString)

/**
 * 判断内容对象是否提供 onFirstScan 方法，不激活资源。
 */
export const hasJSSContentOnFirstScanMethod = (input: unknown): input is JSSContent & Required<Pick<JSSContent, 'onFirstScan'>> =>
  isObjectLike(input) && 'onFirstScan' in input && isFunction(input.onFirstScan)

/**
 * 判断对象是否承担任一种 JSS 内容行为。
 */
export const isJSSContent = (input: unknown): input is JSSContent => (
  hasJSSContentOnCompileMethod(input) ||
  hasJSSContentOutput(input) ||
  isObjectLike(input) && 'dependencies' in input && isArray(input.dependencies) ||
  hasJSSContentOnFirstScanMethod(input)
)

/** 一项声明贡献及其原编译位置的内容视图；替换 content 后由组合结果消费新内容。 */
export interface ContentView extends JSSContentProtocol {
  content: unknown
  dependencies: unknown[]
  toCSSString(resolve?: JSSContentResolver): string | undefined
}

/**
 * 找出内容数据中的表达式与生产函数，嵌套数组保留原始顺序。
 */
export function contentDependencies(content: unknown, active = new Set<object>(), depth = 0): unknown[] {
  assert(depth <= 256, '内容数组嵌套超过上限 256。')
  if (!isArray(content)) return isJSSContent(content) || isFunction(content) ? [content] : []
  assert(!active.has(content), '内容数组存在循环引用。')
  active.add(content)
  try { return content.flatMap(item => contentDependencies(item, active, depth + 1)) }
  finally { active.delete(content) }
}

/**
 * 输出原始内容数据，数组按逗号连接；表达式及函数只读取编译结果。
 */
export function contentDataToCSSString(content: unknown, resolve: JSSContentResolver, separator = ', ', active = new Set<object>(), depth = 0): string | undefined {
  assert(depth <= 256, '内容数组嵌套超过上限 256。')
  if (isNullish(content)) return undefined
  if (!isArray(content)) return isJSSContent(content) || isFunction(content) ? resolve(content) : String(content)
  assert(!active.has(content), '内容数组存在循环引用。')
  active.add(content)
  try {
    const parts = content.map(item => contentDataToCSSString(item, resolve, ', ', active, depth + 1)).filter(item => item !== undefined)
    return parts.length ? parts.join(separator) : undefined
  } finally { active.delete(content) }
}

/**
 * 按空格连接一组原始内容，嵌套数组继续使用自身的逗号含义。
 */
export function arraySequenceToCSSString(content: unknown[], resolve: JSSContentResolver): string | undefined {
  return contentDataToCSSString(content, resolve, ' ')
}
