/** 样式值与状态的统一定义。
 *
 * 保存规范化基础内容及其协议方法，供样式引用和编译消费。
 *
 * 让直接值、计算和状态使用同一对象表达。
 */
import { isFunction } from '@edsolater/fnkit'
import { isJSSContent, contentDataToCSSString, contentDependencies, type JSSCompileContext, type JSSContent, type JSSContentProtocol, type JSSContentContext, type JSSContentResolver } from '../content'
import type { ConditionInput } from '../condition'
import type { ASTController } from '../compiler/contracts'
import type { Rules } from '../rule'
import { parseTokenArgs, type TokenConfig, type TokenDefinitionInput, type TokenStateValues } from './args-parser'
import { resolveStateConditions, type StateCondition } from '../pieces/state-conditions'
import { cssTokenName } from './css'
import { allocateVariableName } from '../custom-property-names'

/** 样式直接内容、表达式或延迟提供的内容。 */
export type TokenInput = string | number | JSSContent | (() => TokenInput) | undefined

/** 创建时可直接传入的内容；普通对象和数组数据由 default 明确承载。 */
export type TokenDirectInput = TokenInput | boolean | null

/** Token 保存的原始数据；对象数据由自身输出方法解释。 */
export type TokenData = TokenDirectInput | object

/** 状态固定值或根据所属定义的基础内容产生结果的规则。 */
export type TokenStateRule = TokenInput | ((base: TokenInput) => TokenInput)

/** 可独立复用的状态规则；接收它的 Token 提供基础内容。 */
export type TokenState = Record<string, TokenStateRule>

/** 定义的明确根据地；缺省地址留待 CSS 坍缩时采用 root。 */
export type TokenAddress = Exclude<ConditionInput, undefined>

/** Token 基础配置及特殊内容的编译、输出协议。 */
export interface TokenOptions<T extends TokenData = TokenData> {
  name?: string
  state?: TokenState
  address?: TokenAddress
  registration?: {
    syntax: string
    inherits: boolean
    /** 独立的 CSS 注册初值，不从 default 推导。 */
    initialValue?: TokenInput
  }
  onFirstScan?: (context: JSSContentContext) => Rules | void
  compileWaveIndex?: number
  /** 特殊定义的对象生命周期；通过 AST 操作生效，不消费返回值。 */
  onCompile?: (context: JSSCompileContext, ast: ASTController) => void
  /** 特殊数据显式给出子内容；函数读取当前 default。 */
  dependencies?: unknown[] | ((content: T) => unknown[])
  /** 特殊格式使用已经准备好的子内容输出，保留原始数据。 */
  toCSSString?: (content: T, resolve: JSSContentResolver) => string | undefined
}

/** 基础内容、可选状态及内容协议组成的同一份样式定义。 */
export interface Token<T extends TokenData = TokenData> extends Omit<JSSContentProtocol, 'compileWaveIndex' | 'onFirstScan'>, TokenConfig<T> {
  /** CSS 坍缩产生的内部类别；调用方按约定不修改。 */
  _kind?: 'css-value' | 'css-variable'
  dependencies: unknown[]
  toCSSString(resolve?: JSSContentResolver): string | undefined
}

const tokens = new WeakSet<object>()
const tokenStates = new WeakMap<object, Map<string, StateCondition>>()
const baseOutputs = new WeakMap<object, JSSContent>()
const customOutputs = new WeakSet<object>()

/**
 * 将直接内容或 default 状态简写创建为独立 Token，不执行内容生产函数。
 * 特殊定义可以提供依赖、编译方法与格式器；基础配置统一由参数解析器取得。
 */
export function token(input: number, options?: string | TokenOptions<number>): Token<number>
export function token(input: string, options?: string | TokenOptions<string>): Token<string>
export function token<T extends TokenDirectInput>(input: T, options?: string | TokenOptions<T>): Token<T>
export function token<D extends { default: TokenData }>(input: TokenDefinitionInput<D>, options?: string | TokenOptions<D['default']>): Token<D['default'] extends number ? number : D['default'] extends string ? string : D['default']>
export function token<T extends TokenData = never>(input: TokenStateValues<NoInfer<T>>, options?: string | TokenOptions<NoInfer<T>>): Token<T>
export function token<T extends TokenData>(input: TokenDirectInput | TokenStateValues<T>, options?: string | TokenOptions<T>): Token<T> {
  const protocol = typeof options === 'string' ? undefined : options
  const self: Token<T> = {
    ...parseTokenArgs<T>(input, options),
    onCompile: protocol?.onCompile,
    get dependencies() {
      const dependencies = protocol?.dependencies
      if (isFunction(dependencies)) return dependencies(self.default)
      return dependencies ?? contentDependencies(self.default)
    },
    /**
     * 输出基础直接内容或特殊格式；子内容结果由编译器提供。
     */
    toCSSString(resolve = primitiveToCSSString) {
      if (self._kind === 'css-variable') return `var(${cssTokenName(self)})`
      return outputBase(resolve)
    },
  }
  baseOutputs.set(self, {
    get dependencies() { return self.dependencies },
    toCSSString(resolve = primitiveToCSSString) {
      return outputBase(resolve)
    },
  })
  if (protocol?.toCSSString || protocol?.dependencies) customOutputs.add(self)
  if (self.name !== undefined) allocateVariableName(self.name)
  tokens.add(self)
  tokenStates.set(self, new Map(resolveStateConditions(Object.keys(self.state ?? {})).map(state => [state.name, state])))
  return self

  /**
   * 为基础格式提供数据解析，普通数组和原语与子表达式共用同一套规则。
   */
  function outputBase(resolve: JSSContentResolver): string | undefined {
    return protocol?.toCSSString
      ? protocol.toCSSString(self.default, child => contentDataToCSSString(child, resolve))
      : contentDataToCSSString(self.default, resolve)
  }
}

/**
 * 识别由统一创建入口建立的 Token，不读取内容或执行函数。
 */
export const isToken = (input: unknown): input is Token => (typeof input === 'object' && input !== null || typeof input === 'function') && tokens.has(input as object)

/**
 * 提供定义基础的实际 CSS 内容，保留特殊格式与依赖而不读取自身变量引用。
 */
export const tokenBaseContent = (input: Token): TokenInput => customOutputs.has(input) || input.default === null || typeof input.default === 'boolean'
  || typeof input.default === 'object' && !isJSSContent(input.default) ? baseOutputs.get(input)! : input.default as TokenInput

/**
 * 取得创建时确定的状态条件，后续新增状态按登记事实补齐。
 */
export function tokenStateEntries(input: Token): Map<StateCondition, TokenStateRule> {
  const conditions = tokenStates.get(input)!
  for (const state of resolveStateConditions(Object.keys(input.state ?? {}))) if (!conditions.has(state.name)) conditions.set(state.name, state)
  return new Map(Object.entries(input.state ?? {}).map(([name, rule]) => [conditions.get(name)!, rule] as const).sort(([left], [right]) => left.order - right.order))
}

/**
 * 输出无需子内容编译的字符串和数值，其余内容等待编译器解析。
 */
function primitiveToCSSString(input: unknown): string | undefined {
  return typeof input === 'string' || typeof input === 'number' ? String(input) : undefined
}
