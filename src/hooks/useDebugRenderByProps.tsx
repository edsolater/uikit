import { useRecordedEffect } from './useRecordedEffect'

export function useDebugRenderByProps<T extends Record<string, any>>(
  props: T,
  onChange: (changedProps: { key: keyof T; oldValue: T[keyof T]; newValue: T[keyof T] }) => void
) {
  useRecordedEffect(
    (oldProps) => {
      for (const [key, value] of Object.entries(props)) {
        const oldValue = oldProps[key]
        if (oldValue !== value) {
          onChange({ key, oldValue, newValue: value })
        }
      }
    },
    [props],
    { shallowShallow: true }
  )
}
