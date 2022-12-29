import { useRecordedEffect } from '../../../hooks'
import { MenuCoreProps } from '../index'

export type MenuCallbackProps<T> = {
  onSwitchSelection?: (menuItem: T) => void
}

export function useMenuCallbacksRegister<T>({
  state: { activeMenu, setActiveMenu },
  props: { onSwitchSelection }
}: {
  state: { activeMenu: T | undefined; setActiveMenu: React.Dispatch<React.SetStateAction<T | undefined>> }
  props: MenuCoreProps<T>
}) {
  useRecordedEffect(
    ([prevActiveMenu]) => {
      if (activeMenu && activeMenu != prevActiveMenu) onSwitchSelection?.(activeMenu)
    },
    [activeMenu]
  )
}
