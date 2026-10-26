/** Token 的 CSS 自定义属性边界。
 *
 * 为实际需要声明身份的定义提供名称、CSS 目标和内部 AST 操作。
 *
 * CSS 形态与编译操作留在这里，不进入 Token 的创建配置。
 */
import { allocateVariableName } from '../custom-property-names'
import {
  createJSSContent,
  type JSSCompileContext,
  type JSSContent,
} from '../content'
import type { ASTController } from '../compiler/contracts'
import type { JSSKeyObject } from '../key'
import {
  tokenBaseContent,
  tokenStateEntries,
  type Token,
  type TokenAddress,
  type TokenInput,
  type TokenOptions,
  type TokenStateRule,
} from './core'
import type { StateCondition } from '../pieces/state-conditions'

/** 已进入 CSS 声明路径的目标材料；状态和基础始终取自所属 Token。 */
export interface CSSCustomProperty {
  token: Token
  key: JSSKeyObject
  content: TokenInput
  address?: TokenAddress
  states: Map<StateCondition, TokenStateRule>
  registration?: TokenOptions['registration']
}

const names = new WeakMap<Token, string>()
const properties = new WeakMap<Token, CSSCustomProperty>()
const operations = new WeakMap<
  object,
  (context: JSSCompileContext, controller: ASTController) => void
>()

/**
 * 取得稳定的完整 CSS 名称；缓存的自动名称不成为显式创建配置。
 */
export function cssTokenName(token: Token): string {
  if (token.name !== undefined)
    return `--${allocateVariableName(token.name).replace(/^--/, '')}`
  const name = `--${allocateVariableName(undefined, names.get(token)).replace(/^--/, '')}`
  names.set(token, name)
  return name
}

/**
 * 在 CSS 边界取得定义的声明材料，不建立另一份样式值模型。
 */
export function cssCustomProperty(token: Token): CSSCustomProperty {
  let target = properties.get(token)
  if (!target) {
    target = {
      token,
      key: {
        toCSSString: () => cssTokenName(token),
        join: (values) => values.at(-1),
      },
      get content() {
        return tokenBaseContent(token)
      },
      get address() {
        return token.address
      },
      get states() {
        return tokenStateEntries(token)
      },
      get registration() {
        return token.registration
      },
    }
    properties.set(token, target)
  }
  return target
}

/**
 * 创建由编译准备阶段推进的内部 AST 操作，不使用对象生命周期回调重试。
 */
export function cssOperation(
  prepare: (context: JSSCompileContext, controller: ASTController) => void,
): JSSContent {
  const operation = createJSSContent(() => undefined)
  operations.set(operation, prepare)
  return operation
}

/**
 * 取得内部 CSS 操作；普通内容没有编译准备动作。
 */
export const cssPreparation = (input: object) => operations.get(input)
