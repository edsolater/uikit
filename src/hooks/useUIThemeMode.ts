/**
 * 这个 hook 负责管理全局 theme mode，并把解析后的主题写回 document 根节点。
 * 它只处理 light / dark / system 三态切换，不负责具体控件展示。
 */
import { createEffect, onCleanup, onMount } from 'solid-js'
import { createElementAttributeMarker } from './createElementAttributeMarker'
import { createState, val } from './createState'
import { useDOMRegisterer } from './useDOMRegisterer'

export type UIThemeMode = 'light' | 'dark' | 'system'

const themeSwitchingStyleId = 'uikit-theme-switcher'
const themeSwitchingStyleText = `
:root[data-is-theme-switching='true'],
:root[data-is-theme-switching='true'] *,
:root[data-is-theme-switching='true'] *::before,
:root[data-is-theme-switching='true'] *::after {
  transition: none !important;
}
`

function resolveUIThemeMode(mode: UIThemeMode, media: MediaQueryList) {
  return mode === 'system' ? (media.matches ? 'dark' : 'light') : mode
}

/**
 * 把当前选中的模式写到根节点。
 * hook 内保留三态模式：light / dark / system。
 * DOM 只写解析后的 `data-theme`，CSS 通过选择器覆盖对应主题 token。
 */
function applyGlobalUIThemeMode(mode: UIThemeMode, root: HTMLHtmlElement, markThemeSwitching: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const resolvedTheme = resolveUIThemeMode(mode, media)

  markThemeSwitching()
  root.dataset.theme = resolvedTheme
  root.style.colorScheme = mode === 'system' ? 'light dark' : resolvedTheme
}

export function useUIThemeMode(initialMode: UIThemeMode = 'light') {
  const themeMode = createState<UIThemeMode>(initialMode)
  const root = typeof document === 'undefined' ? undefined : (document.documentElement as HTMLHtmlElement)
  const themeSwitchingMarker =
    root === undefined
      ? { mark: () => undefined, cleanup: () => undefined }
      : createElementAttributeMarker({
          element: root,
          attributeName: 'data-is-theme-switching',
          removeAfterFrames: 2,
        })
  const themeSwitchingStyleRegisterer = useDOMRegisterer({
    id: themeSwitchingStyleId,
    tagName: 'style',
    target: 'head',
    setup: (styleElement) => {
      styleElement.textContent = themeSwitchingStyleText
    },
  })

  // 这层保护样式只在 hook 被消费时挂载，避免把功能性规则塞进 reset.css。
  onMount(() => {
    if (root === undefined) {
      return
    }

    themeSwitchingStyleRegisterer.register()
    onCleanup(themeSwitchingStyleRegisterer.unregister)
  })

  createEffect(() => {
    if (typeof window === 'undefined' || root === undefined) {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => applyGlobalUIThemeMode(val(themeMode), root, themeSwitchingMarker.mark)

    applyTheme()

    /*
     * 只有“跟随系统”模式需要监听系统主题变化。
     * 显式 light / dark 模式下，重复注册监听只会增加维护噪音。
     */
    if (val(themeMode) !== 'system') {
      return
    }

    media.addEventListener('change', applyTheme)
    onCleanup(() => media.removeEventListener('change', applyTheme))
  })

  onCleanup(() => {
    if (root === undefined) {
      return
    }

    root.style.removeProperty('color-scheme')
    root.removeAttribute('data-theme')
    themeSwitchingMarker.cleanup()
  })

  return themeMode
}
