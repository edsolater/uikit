/**
 * 描述全局节点应该挂到哪里。
 * 调用方可以直接给 body / head，也可以给现成容器，或者延迟解析容器。
 */
type DomRegisterTarget = 'head' | 'body' | ParentNode | (() => ParentNode | null | undefined)

/**
 * registry 内部保存的挂载记录。
 */
type DomRegisterEntry = {
  /** 当前被复用的真实 DOM 节点。 */
  element: HTMLElement

  /** 当前有多少消费者正在共享这一个节点。 */
  consumers: number
}

/**
 * useDomRegisterer 的配置项。
 */
type UseDomRegistererOptions<TagName extends keyof HTMLElementTagNameMap> = {
  /**
   * 全局节点的唯一标识。
   * 相同 id 会复用同一个 DOM 节点，并累加 consumers。
   */
  id: string

  /** 要创建的 DOM 标签名，例如 style、script 或 meta。 */
  tagName: TagName

  /**
   * 节点要插入到哪个容器。
   * 默认是 head；也可以显式指定 body、现成 ParentNode，或一个延迟解析函数。
   */
  target?: DomRegisterTarget

  /**
   * 节点创建后、插入前的初始化逻辑。
   * 适合在这里写 textContent、属性、dataset 等一次性配置。
   */
  setup?: (element: HTMLElementTagNameMap[TagName]) => void
}

// 全局 DOM 挂载天然是进程级共享状态，用模块级 registry 比 Context 更直接。
const domRegisterRegistry = new Map<string, DomRegisterEntry>()

function resolveDomRegisterTarget(target: DomRegisterTarget | undefined): ParentNode | null {
  if (typeof document === 'undefined') {
    return null
  }

  if (target === undefined || target === 'head') {
    return document.head
  }

  if (target === 'body') {
    return document.body
  }

  return (typeof target === 'function' ? target() : target) ?? null
}

/**
 * 提供一个目标确定的全局 DOM 注册器。
 * 调用方自己决定什么时候 register / unregister；
 * 此 primitive 只负责按 id 复用同一个 DOM 节点，并维护消费者计数。
 */
export function useDomRegisterer<TagName extends keyof HTMLElementTagNameMap>({
  id,
  tagName,
  target,
  setup,
}: UseDomRegistererOptions<TagName>) {
  const register = () => {
    const existingEntry = domRegisterRegistry.get(id) as DomRegisterEntry | undefined

    if (existingEntry !== undefined) {
      existingEntry.consumers += 1
      setup?.(existingEntry.element as HTMLElementTagNameMap[TagName])
      return existingEntry.element as HTMLElementTagNameMap[TagName]
    }

    const mountTarget = resolveDomRegisterTarget(target)

    if (mountTarget === null) {
      return undefined
    }

    const element = document.createElement(tagName)

    setup?.(element)
    mountTarget.append(element)

    domRegisterRegistry.set(id, {
      element,
      consumers: 1,
    })

    return element
  }

  const unregister = () => {
    const existingEntry = domRegisterRegistry.get(id)

    if (existingEntry === undefined) {
      return
    }

    existingEntry.consumers = Math.max(0, existingEntry.consumers - 1)

    if (existingEntry.consumers) return

    existingEntry.element.remove()
    domRegisterRegistry.delete(id)
  }

  return {
    register,
    unregister,
  }
}
