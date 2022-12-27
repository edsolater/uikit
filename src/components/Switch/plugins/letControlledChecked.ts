import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPlugin } from '../../../plugins'
import { SwitchController, SwitchCoreProps } from '../index'

export type LetControlledChecked = {
  checked?: boolean
}
export const letControlledChecked = createPlugin<SwitchCoreProps & LetControlledChecked>(({ checked }) => {
  const switchController = useRef<SwitchController>()
  useLayoutEffect(() => {
    if (checked != null) switchController.current?.setChecked(checked)
  }, [checked])
  return {
    defaultChecked: checked,
    $disableUserInput: checked != null,
    controller: switchController
  }
})
