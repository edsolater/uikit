/**
 * 这个文件只负责 ColorDashboard 的 theme mode 切换控件。
 * 全局 theme mode 副作用交给 hook，这里只负责控件展示。
 */
import { For } from 'solid-js'
import { useUIThemeMode, val, type UIThemeMode } from '../../hooks'

const themeModeOptions: { value: UIThemeMode; label: string }[] = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' },
]

export function ThemeModeControl() {
  const themeMode = useUIThemeMode()

  return (
    <fieldset>
      <legend>模式切换</legend>
      <For each={themeModeOptions}>
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
