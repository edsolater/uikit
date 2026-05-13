/**
 * 补齐 Popover API 与相关 HTML 属性在当前 JSX 类型里的声明。
 * 当前项目只面向最新 Chrome，因此直接按已可用能力补齐，不保留兼容分支。
 */
declare module 'solid-js' {
  namespace JSX {
    interface HTMLAttributes<T> {
      popover?: boolean | 'auto' | 'hint' | 'manual'
    }

    interface ButtonHTMLAttributes<T> {
      popovertarget?: string
      popovertargetaction?: 'toggle' | 'show' | 'hide'
    }
  }
}

export {}