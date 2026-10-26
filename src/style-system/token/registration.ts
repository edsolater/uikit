/** CSS 自定义属性的按需注册。
 *
 * 发布类型、继承和独立初值，并按实际消费者维护共享归属。
 *
 * 让注册与普通 AST 资源共用撤销机制。
 */
import { assert, mapGet } from '@edsolater/fnkit'
import { propertyName } from '../key'
import type { JSSCompileContext } from '../content'
import type { ASTController, JSSStyleNode } from '../compiler/contracts'
import type { TokenInput, TokenOptions } from './core'
import type { CSSCustomProperty } from './css'

/** 同一对象的激活期消费者；资源被同名对象替换后，旧对象的重复引用不重新覆盖注册。 */
const registrationSessions = new WeakMap<object, Map<CSSCustomProperty, Map<JSSStyleNode, Set<unknown>>>>()

/**
 * 按 registration 登记 CSS @property；对象首次消费时替换同址资源，全部消费者撤销后可再次激活。
 */
export function activateCSSRegistration(variable: CSSCustomProperty, context: JSSCompileContext, controller: ASTController): void {
  const registration = variable.registration
  if (!registration) return
  const address = `variable-registration:${propertyName(variable.key)}`
  let registrations = registrationSessions.get(context.session)
  if (!registrations) registrationSessions.set(context.session, registrations = new Map())
  const active = registrations.has(variable)
  const consumers = mapGet(registrations, variable, () => new Map<JSSStyleNode, Set<unknown>>())
  if (!consumers.has(context.node)) {
    const inputs = new Set<unknown>()
    consumers.set(context.node, inputs)
    let consuming = true
    const release = () => {
      if (!consuming) return
      consuming = false
      consumers.delete(context.node)
      if (!consumers.size) registrations.delete(variable)
      for (const node of controller.search({ productTag: variable }))
        controller.release(node, { owner: context.node })
    }
    controller.onRemove(context.node, release)
    controller.addSettlementCheck(() => {
      if (!consuming) return false
      for (const input of inputs) if (!controller.usesContent(context.node, input)) inputs.delete(input)
      if (inputs.size) return false
      release()
      return true
    })
  }
  consumers.get(context.node)!.add(context.input)
  if (active) {
    for (const node of controller.search({ resourceAddress: address, productTag: variable })) controller.depend(node, { owner: context.node })
    return
  }
  for (const node of controller.search({ resourceAddress: address })) controller.remove(node)
  const registrationPath = {
    targetConditionPath: [{ get header() { return `@property ${propertyName(variable.key)}` } }],
    stateConditionPath: [],
  }
  const provenance = { owner: context.node, resourceAddress: address, productTag: variable,
    initialize(node: JSSStyleNode) {
      Object.defineProperty(node, 'resourceAddress', { configurable: true, enumerable: true,
        get: () => `variable-registration:${propertyName(variable.key)}` })
    },
  }
  for (const declaration of cssRegistrationDeclarations(registration))
    controller.insert({ before: context.node, conditionPath: registrationPath }, declaration, provenance)
}

/**
 * 生成 @property 的字段内容；省略 initialValue 时不提供 initial-value，生命周期由消费方处理。
 */
export function cssRegistrationDeclarations(registration: NonNullable<TokenOptions['registration']>): [key: string, content: TokenInput][] {
  assert(typeof registration.syntax === 'string', 'Token registration.syntax 必须是字符串。')
  assert(typeof registration.inherits === 'boolean', 'Token registration.inherits 必须是 boolean。')
  const declarations: [key: string, content: TokenInput][] = [
    ['syntax', JSON.stringify(registration.syntax)],
    ['inherits', String(registration.inherits)],
  ]
  if (registration.initialValue !== undefined) declarations.push(['initial-value', registration.initialValue])
  return declarations
}
