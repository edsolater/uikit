/**
 * 补齐 Chrome 已支持但 TypeScript DOM 标准库尚未收录的 element-scoped view transition 类型。
 * 当前只补到 HTMLElement，上层具体元素类型会自动继承这个能力。
 */
type HTMLElementStartViewTransitionOptions = ViewTransitionUpdateCallback | StartViewTransitionOptions

declare global {
  interface HTMLElement {
    startViewTransition?(options?: HTMLElementStartViewTransitionOptions): ViewTransition
  }
}

export {}
