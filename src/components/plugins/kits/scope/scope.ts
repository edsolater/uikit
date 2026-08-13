/**
 * Scope Plugin：为主动支持 Scope 的能力建立可嵌套范围。
 *
 * 【职责边界】登记范围并按能力身份寻找最近边界；不解释 Drag and Drop 等具体能力的行为。
 */
import { onCleanup } from 'solid-js'
import type { PivTag } from '../../../Piv/domMap'
import { createPlugin } from '../../definePlugin'

export interface ScopeCapability {
  /** 能力身份只按 key 判断；name 只服务调试和 DOM 标记。 */
  key: symbol
  name: string
}

export interface ScopeOptions {
  /** 省略时建立约束全部 Scope-aware 能力的全量 Scope。 */
  capabilities?: Iterable<ScopeCapability>
}

export interface ScopeController {
  /** true 表示当前 Scope 会命中所有主动支持 Scope 的能力。 */
  full: boolean
  capabilities: ScopeCapability[]
  includes(capability: ScopeCapability): boolean
}

interface ScopeBoundary {
  controller: ScopeController
}

const scopeBoundaries = new WeakMap<HTMLElement, ScopeBoundary>()

/** 创建一个可供 Scope 识别的开放能力身份。 */
export function createScopeCapability(name: string): ScopeCapability {
  return { key: Symbol(name), name }
}

export const scope = createPlugin<ScopeOptions, ScopeController, PivTag>((options) => {
  const capabilities = options?.capabilities === undefined
    ? []
    : Array.from(options.capabilities)
  const capabilityKeys = new Set(capabilities.map((capability) => capability.key))
  const full = options?.capabilities === undefined
  const controller: ScopeController = {
    full,
    capabilities,
    includes: (capability) => full || capabilityKeys.has(capability.key),
  }
  const boundary: ScopeBoundary = { controller }

  return {
    controller,
    plugin: ({ element }) => {
      scopeBoundaries.set(element, boundary)
      onCleanup(() => {
        if (scopeBoundaries.get(element) === boundary) {
          scopeBoundaries.delete(element)
        }
      })

      return {
        htmlProps: {
          'data-plugin': { mergable: 'scope' },
          'data-scope': full
            ? 'all'
            : capabilities.map((capability) => capability.name).join(' '),
        },
      }
    },
  }
})

/** 找到当前元素自己或祖先中，距离最近且命中指定能力的 Scope。 */
export function findScopeBoundary(
  element: HTMLElement | undefined,
  capability: ScopeCapability,
): object | undefined {
  let currentElement: HTMLElement | null | undefined = element

  while (currentElement) {
    const boundary = scopeBoundaries.get(currentElement)
    if (boundary?.controller.includes(capability)) return boundary
    currentElement = getComposedParent(currentElement)
  }

  return undefined
}

/** Scope 沿现代 composed tree 查找，使 Shadow DOM 与 slot 不会意外切断范围。 */
function getComposedParent(element: HTMLElement): HTMLElement | null {
  if (element.assignedSlot) return element.assignedSlot
  if (element.parentElement) return element.parentElement

  const root = element.getRootNode()
  return root instanceof ShadowRoot && root.host instanceof HTMLElement
    ? root.host
    : null
}
