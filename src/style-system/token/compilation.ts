/**
 * Token 的 CSS 编译准备。
 *
 * 为实际消费建立根据地、状态与注册，并在准备稳定后统一确定输出类别。
 *
 * 对象生命周期与每个声明位置的 CSS 接线分别处理。
 */
import {
  createJSSContent,
  type JSSCompileContext,
  type JSSContent,
} from '../content'
import type { ASTController, JSSStyleNode } from '../compiler/contracts'
import { isToken, type Token } from './core'
import { cssCustomProperty, cssTokenName } from './css'
import { activateCSSRegistration } from './registration'
import {
  consumeDeclaration,
  declaredCSSProperty,
  ensureDefinition,
} from './declare'

/** 本次编译实际访问的定义和位置；不跨会话保存消费关系。 */
export class TokenCompilation {
  private consumers = new Map<Token, Map<JSSStyleNode, boolean>>()

  constructor(private controller: ASTController) {}

  /**
   * 准备一个实际位置的 CSS 引用或声明目标，保留所属对象的共享生命周期。
   */
  prepare(token: Token, context: JSSCompileContext): JSSContent {
    let consumers = this.consumers.get(token)
    if (!consumers) {
      this.consumers.set(token, (consumers = new Map()))
      token._kind = undefined
    }
    const variable = this.needsProperty(token)
    consumers.set(context.node, variable)
    if (variable) {
      const target = cssCustomProperty(token)
      activateCSSRegistration(target, context, this.controller)
      if (context.role === 'declaration-key') {
        if (
          context.node.key === token &&
          !declaredCSSProperty(context.node) &&
          (context.node.content as { kind?: string } | undefined)?.kind !==
            'css-modification'
        )
          ensureDefinition(context.node, this.controller, target)
        return createJSSContent(() => cssTokenName(token))
      }
      consumeDeclaration(context, this.controller, target)
    }
    return createJSSContent(
      (resolve) => token.toCSSString(resolve),
      variable ? [] : token.dependencies,
    )
  }

  /**
   * 在已知操作准备完成后确定输出类别，身份改变的位置重新读取实际依赖。
   */
  settle(): boolean {
    let changed = false
    const nodes = new Set(this.controller.nodes())
    for (const [token, consumers] of this.consumers) {
      const variable = this.needsProperty(token)
      token._kind = variable ? 'css-variable' : 'css-value'
      for (const [node, previous] of consumers) {
        if (!nodes.has(node) || !this.controller.usesContent(node, token)) {
          consumers.delete(node)
          continue
        }
        if (previous !== variable) {
          consumers.set(node, variable)
          node.compileRevision++
          changed = true
        }
      }
    }
    return changed
  }

  /**
   * CSS 身份来自当前定义与当前 AST 的声明或修改使用，不读取过去的自动名称。
   */
  private needsProperty(token: Token): boolean {
    return (
      token.name !== undefined ||
      token.state !== undefined ||
      token.address !== undefined ||
      token.registration !== undefined ||
      this.controller
        .nodes()
        .some((node) => isToken(node.key) && node.key === token)
    )
  }
}
