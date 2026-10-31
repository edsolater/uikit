/**
 * 样式值与状态的统一定义。
 *
 * 保存规范化基础内容及其协议方法，供样式引用和编译消费。
 *
 * 让直接值、计算和状态使用同一对象表达。
 */
import {
  isBoolean,
  isString,
  isFunction,
  isObject,
  isObjectLike,
} from '@edsolater/fnkit'
import {
  isJSSContent,
  contentDataToCSSString,
  contentDependencies,
  type JSSCompileContext,
  type JSSContent,
  type JSSContentProtocol,
  type JSSContentContext,
  type JSSContentResolver,
} from '../content'
import type { ConditionInput } from '../condition'
import type { ASTController } from '../compiler/contracts'
import type { Rules } from '../rule'
import {
  parseTokenArgs,
  type TokenConfig,
  type TokenDefaultInput,
} from './args-parser'
import type { StateCondition, StateConditionInput } from '../state-condition'
import { cssTokenName } from './css'
import { allocateVariableName } from '../custom-property-names'

/** 样式直接内容、表达式或延迟提供的内容。 */
export type TokenInput =
  string | number | JSSContent | (() => TokenInput) | undefined

/** 创建时可直接传入的原始数据、表达式或内容生产器。 */
export type TokenData = TokenInput | boolean | null | object

/** 状态固定值或根据所属定义的基础内容产生结果的规则。 */
export type TokenStateRule = TokenInput | ((base: TokenInput) => TokenInput)

/** 参数入口归一后的内部状态表；定义状态使用 TokenStateInput 对象或条目。 */
export type TokenState = Map<StateCondition, TokenStateRule>

/** 状态对象、条件条目及其任意层级的可迭代组合。 */
export type TokenStateInput =
  | Record<string, TokenStateRule>
  | readonly [StateConditionInput, TokenStateRule]
  | Iterable<TokenStateInput>

/** 显式固定的声明地址；未指定时由各个使用位置提供。 */
export type TokenAddress = Exclude<ConditionInput, undefined>

/** Token 基础配置及特殊内容的编译、输出协议。 */
export interface TokenOptions<T extends TokenData = TokenData> {
  /**
   * 普通定义按约定提供语义名称；生成器已有语义前缀时可省略。
   * 引用已有 Token 不继承其名称，前缀仍补充在自身名称之前。
   */
  name?: string
  state?: TokenStateInput
  /**
   * 指定时在固定地址发布；继承后仍未指定时，需 CSS variable 的 Token
   * 在各个 AST 使用地址发布 default 和 state，不写回对象或锁定首处。
   * 全局共享须显式指定 root；直接 CSS value 不受地址缺省规则影响。
   */
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
export interface Token<T extends TokenData = TokenData>
  extends
    Omit<JSSContentProtocol, 'compileWaveIndex' | 'onFirstScan'>,
    TokenConfig<T> {
  /** CSS 坍缩产生的内部类别；调用方按约定不修改。 */
  _kind?: 'css-value' | 'css-variable'
  dependencies: unknown[]
  toCSSString(resolve?: JSSContentResolver): string | undefined
}

const tokens = new WeakSet<object>()
const baseOutputs = new WeakMap<object, JSSContent>()
const customOutputs = new WeakSet<object>()

/**
 * 将原始内容创建为 Token；已有 Token 复用配置，不执行内容生产函数。
 * 特殊定义可以提供依赖、编译方法与格式器；基础配置统一由参数解析器取得。
 */
export function token<T extends TokenData, U extends TokenData>(
  input: Token<T>,
  options: TokenOptions<U> & { default: U },
): Token<U>
export function token<T extends TokenData>(
  input: Token<T>,
  options?: string | TokenOptions<Token<T>>,
): Token<Token<T>>
export function token(
  input: number,
  options?: string | TokenOptions<number>,
): Token<number>
export function token(
  input: string,
  options?: string | TokenOptions<string>,
): Token<string>
export function token<T extends TokenData>(
  input: T & TokenDefaultInput<T>,
  options?: string | TokenOptions<T>,
): Token<T>
export function token<T extends TokenData>(
  input: TokenData,
  options?: string | (TokenOptions<T> & { default?: T }),
): Token<T> {
  return createTokenDefinition<T>(input, options)
}

/**
 * 统一创建 Token 定义，生成器只在此提供额外名称前缀。
 */
export function createTokenDefinition<T extends TokenData>(
  input: TokenData,
  options?: string | (TokenOptions<T> & { default?: T }),
  prefixName?: string,
): Token<T> {
  return isToken(input)
    ? tokenFrom<T>(input, options, prefixName)
    : createToken(input as T, options, prefixName)
}

/** 创建实际 Token 对象，基础内容始终按原始数据保存。 */
function createToken<T extends TokenData>(
  input: T,
  options?: string | TokenOptions<T>,
  prefixName?: string,
): Token<T> {
  const protocol = isString(options) ? { name: options } : options
  const entityName =
    protocol?.name ??
    (prefixName !== undefined ? allocateVariableName() : undefined)
  const name =
    entityName === undefined
      ? undefined
      : [prefixName, entityName]
          .filter((part) => part !== undefined)
          .join('-')
  const self: Token<T> = {
    ...parseTokenArgs<T>(input, protocol),
    name,
    onCompile: protocol?.onCompile,
    get dependencies() {
      const dependencies = protocol?.dependencies
      if (isFunction(dependencies)) return dependencies(self.default)
      return dependencies ?? contentDependencies(self.default)
    },
    /**
     * 输出变量引用、基础内容或特殊格式；子内容结果由编译器提供。
     */
    toCSSString(resolve = primitiveToCSSString) {
      if (self._kind === 'css-variable') return `var(${cssTokenName(self)})`
      return outputBase(resolve)
    },
  }
  baseOutputs.set(self, {
    get dependencies() {
      return self.dependencies
    },
    toCSSString(resolve = primitiveToCSSString) {
      return outputBase(resolve)
    },
  })
  if (protocol?.toCSSString || protocol?.dependencies) customOutputs.add(self)
  tokens.add(self)
  return self

  /**
   * 为基础格式提供数据解析，普通数组和原语与子表达式共用同一套规则。
   */
  function outputBase(resolve: JSSContentResolver): string | undefined {
    return protocol?.toCSSString
      ? protocol.toCSSString(self.default, (child) =>
          contentDataToCSSString(child, resolve),
        )
      : contentDataToCSSString(self.default, resolve)
  }
}

/** 复用来源配置并合并状态，再交统一入口创建新 Token。 */
function tokenFrom<T extends TokenData>(
  source: Token,
  options?: string | (TokenOptions<T> & { default?: T }),
  prefixName?: string,
): Token<T> {
  const additional = isString(options) ? { name: options } : options
  const definition = {
    default: source,
    address: source.address,
    state: source.state,
    registration: source.registration,
    onFirstScan: source.onFirstScan,
    compileWaveIndex: source.compileWaveIndex,
    onCompile: source.onCompile,
    ...additional,
  }
  const state = additional?.state
  if (state !== undefined) definition.state = [source.state ?? {}, state]
  return createToken(definition.default as T, definition, prefixName)
}

/**
 * 识别由统一创建入口建立的 Token，不读取内容或执行函数。
 */
export const isToken = (input: unknown): input is Token =>
  isObjectLike(input) && tokens.has(input)

/**
 * 提供定义基础的实际 CSS 内容，保留特殊格式与依赖而不读取自身变量引用。
 */
export const tokenBaseContent = (input: Token): TokenInput =>
  customOutputs.has(input) ||
  input.default === null ||
  isBoolean(input.default) ||
  (isObject(input.default) && !isJSSContent(input.default))
    ? baseOutputs.get(input)!
    : (input.default as TokenInput)

/**
 * 输出无需子内容编译的字符串和数值，其余内容等待编译器解析。
 */
function primitiveToCSSString(input: unknown): string | undefined {
  return isString(input) || typeof input === 'number'
    ? String(input)
    : undefined
}
