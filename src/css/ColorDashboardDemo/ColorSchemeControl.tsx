/**
 * 这个文件只负责 ColorDashboard 的 theme mode 切换控件。
 * 它负责把用户模式解析成最终 theme，并写回 document 根节点。
 */
import { For, createEffect, onCleanup, onMount } from 'solid-js'
import { createState, val } from '../../hooks'
import { createAttributeMarker } from '../../hooks/createAttributeMarker'
import { useDomRegisterer } from '../../hooks/useDomRegisterer'

type ThemeMode = 'light' | 'dark' | 'system'

const themeSwitchingStyleId = 'uikit-theme-switcher'
const themeSwitchingStyleText = `
:root[data-is-theme-switching='true'],
:root[data-is-theme-switching='true'] *,
:root[data-is-theme-switching='true'] *::before,
:root[data-is-theme-switching='true'] *::after {
  transition: none !important;
}
`

/**
 * 把当前选中的模式写到根节点。
 * 组件内部保留三态模式：light / dark / system。
 * DOM 只写解析后的 `data-theme`，CSS 再把它映射成 `--theme: light | dark`。
 */
function applyGlobalThemeMode(mode: ThemeMode, root: HTMLHtmlElement, markThemeSwitching: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const resolvedTheme = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode

  markThemeSwitching()
  root.dataset.theme = resolvedTheme
  root.style.colorScheme = mode === 'system' ? 'light dark' : resolvedTheme
}

export function ThemeModeControl() {
  const root = document.documentElement as HTMLHtmlElement
  const themeMode = createState<ThemeMode>('light')
  const themeSwitchingMarker = createAttributeMarker({
    element: root,
    attributeName: 'data-is-theme-switching',
    removeAfterFrames: 2,
  })
  const themeSwitchingStyleRegisterer = useDomRegisterer({
    id: themeSwitchingStyleId,
    tagName: 'style',
    target: 'head',
    setup: (styleElement) => {
      styleElement.textContent = themeSwitchingStyleText
    },
  })

  // 这层保护样式只在控件存在时挂载，避免把功能性规则塞进 reset.css。
  onMount(() => {
    themeSwitchingStyleRegisterer.register()
    onCleanup(themeSwitchingStyleRegisterer.unregister)
  })

  createEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => applyGlobalThemeMode(val(themeMode), root, themeSwitchingMarker.mark)

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
    root.style.removeProperty('color-scheme')
    root.removeAttribute('data-theme')
    themeSwitchingMarker.cleanup()
  })

  return (
    <fieldset>
      <legend>模式切换</legend>
      <For
        each={
          [
            { value: 'light', label: '浅色' },
            { value: 'dark', label: '深色' },
            { value: 'system', label: '跟随系统' },
          ] as const
        }
      >
        {(item) => (
          <label>
            <input
              type="radio"
              name="theme-mode"
              checked={val(themeMode) === item.value}
              onChange={() => themeMode.set(item.value)}
            />
            {item.label}
          </label>
        )}
      </For>
    </fieldset>
  )
}
