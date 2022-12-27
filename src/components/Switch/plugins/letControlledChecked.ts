import { useEffect, useRef } from 'react'
import { createPlugin } from '../../../plugins'
import { SwitchController, SwitchCoreProps } from '../index'

export type LetControlledChecked = {
  checked?: boolean
}
export const letControlledChecked = createPlugin<SwitchCoreProps & LetControlledChecked>(({ checked }) => {
  const switchController = useRef<SwitchController>()
  useEffect(() => {
    if (checked != null) switchController.current?.setChecked(checked)
  }, [checked])
  return {
    defaultChecked: checked,
    controller: switchController
  }
})
