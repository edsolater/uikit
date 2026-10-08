/** JSS 内容与表达式的消费协议。
 *
 * 定义广义生命周期、子内容解析与纯内容表达式的输出边界。
 *
 * 让编译器消费对象能力，同时让内容组织工具保持自身职责。
 */
import { hasProperty, isArray, isFunction } from '@edsolater/fnkit'
import type { ConditionPath } from './condition'
import type { JSSKey } from './key'
import type { Rules } from './rule'
import type { JSSStyleNode } from './compiler/rules-to-style-nodes'
import type { ASTController } from './compiler/ast-controller'

/** 输出节点时取得已经编译的子内容。 */
export type JSSContentResolver = (content: unknown) => string | undefined

/** 内容被激活时的编译位置。 */
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
  /** 仅声明内容角色携带；沿编译内容和 dependencies 传递。 */
  readState?: string
}

/** 可按需提供依赖规则、编译结果或 CSS 输出的内容对象。 */
export interface JSSContent {
  /** 按需 Rules 中需要独立保留的内容，可显式声明资源身份。 */
  resourceIdentity?: string | symbol
  /** 首次被消费时提供按需 Rules；本次编译的其他消费者共享其产物。 */
  onActive?: (context: JSSContentContext) => Rules | void
  /** 最早执行 onCompile 的编译波，省略为第 0 波。 */
  compileWaveIndex?: number
  /** 编译时通知当前消费位置；通过 Controller 操作内容与队列，不使用返回值。 */
  onCompile?: (context: JSSCompileContext, ast: ASTController) => void
  /** 随本对象一起编译的依赖内容。 */
  dependencies?: unknown[]
  /** 输出 CSS 文本；resolve 可取得已经编译的子内容。 */
  toCSSString?: (resolve?: JSSContentResolver) => string | undefined
}

/** 只组织自身依赖与 CSS 输出的表达式；自身不承担消费位置、AST 操作或资源定义。 */
export interface Expression extends JSSContent {
  dependencies: unknown[]
  toCSSString(resolve?: JSSContentResolver): string | undefined
  onActive?: never
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
 * 判断内容对象是否提供 onCompile 方法。
 */
export const hasJSSContentOnCompileMethod = (input: unknown): input is JSSContent & Required<Pick<JSSContent, 'onCompile'>> =>
  hasProperty(input, 'onCompile', isFunction)

/**
 * 判断内容对象是否公开 CSS 输出方法。
 */
export const hasJSSContentOutput = (input: unknown): input is JSSContent & Required<Pick<JSSContent, 'toCSSString'>> =>
  hasProperty(input, 'toCSSString', isFunction)

/**
 * 判断内容对象是否提供 onActive 方法，不激活资源。
 */
export const hasJSSContentOnActiveMethod = (input: unknown): input is JSSContent & Required<Pick<JSSContent, 'onActive'>> =>
  hasProperty(input, 'onActive', isFunction)

/**
 * 判断对象是否承担任一种 JSS 内容行为。
 */
export const isJSSContent = (input: unknown): input is JSSContent => (
  hasJSSContentOnCompileMethod(input) ||
  hasJSSContentOutput(input) ||
  hasProperty(input, 'dependencies', isArray) ||
  hasJSSContentOnActiveMethod(input)
)
