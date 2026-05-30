/**
 * 这个文件只负责 ColorDashboard 的 theme mode 切换控件。
 * 它负责把用户模式解析成最终 theme，并写回 document 根节点。
 */
import { For, createEffect, onCleanup } from 'solid-js'
import { val, createState } from '../../hooks'

type ThemeMode = 'light' | 'dark' | 'system'

/**
 * 把当前选中的模式写到根节点。
 * `data-theme-mode` 表示用户偏好，`data-theme` 表示解析后的实际主题。
 * CSS 内部再把 `data-theme` 映射成 `--theme: light | dark`。
 */
function applyGlobalThemeMode(mode: ThemeMode) {
  const root = document.documentElement
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const resolvedTheme = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode

  root.dataset.themeMode = mode
  root.dataset.theme = resolvedTheme
  root.style.colorScheme = mode === 'system' ? 'light dark' : resolvedTheme
}

export function ThemeModeControl() {
  const themeMode = createState<ThemeMode>('light')

  createEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => applyGlobalThemeMode(val(themeMode))

    apply()

    if (val(themeMode) !== 'system') {
      return
    }

    media.addEventListener('change', apply)
    onCleanup(() => media.removeEventListener('change', apply))
  })

  onCleanup(() => {
    const root = document.documentElement

    root.style.removeProperty('color-scheme')
    root.removeAttribute('data-theme')
    root.removeAttribute('data-theme-mode')
  })

  return (
    <fieldset>
      <legend>模式切换</legend>
      <For
        each={[
          { value: 'light', label: '浅色' },
          { value: 'dark', label: '深色' },
          { value: 'system', label: '跟随系统' },
        ] as const}
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
