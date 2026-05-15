/**
 * 这个文件只负责 ColorDashboard 的 color-scheme 切换控件。
 * 它负责 color-scheme 的领域状态和写入 document 根节点，不负责颜色列表读取。
 */
import { For, createEffect, onCleanup } from 'solid-js'
import { $, createState } from '../../hooks'

type ColorSchemeMode = 'light' | 'dark' | 'light dark'

/**
 * 把当前选中的模式写到根节点，强制切换全局的 color-scheme。
 */
function applyGlobalColorScheme(mode: ColorSchemeMode) {
  document.documentElement.style.colorScheme = mode
}

export function ColorSchemeControl() {
  const [colorScheme, setColorScheme] = createState<ColorSchemeMode>('light')

  createEffect(() => {
    applyGlobalColorScheme($(colorScheme))
  })

  onCleanup(() => {
    document.documentElement.style.removeProperty('color-scheme')
  })

  return (
    <fieldset>
      <legend>模式切换</legend>
      <For each={['light', 'dark', 'light dark'] as const}>
        {(mode) => (
          <label>
            <input
              type="radio"
              name="color-scheme-mode"
              checked={$(colorScheme) === mode}
              onChange={() => setColorScheme(mode)}
            />
            {mode}
          </label>
        )}
      </For>
    </fieldset>
  )
}
