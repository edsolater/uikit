import { useLayoutEffect, useRef } from 'react'
import { createPlugin } from '../../../plugins'
import { SwitchController, SwitchProps } from '../index'

export type LetControlledChecked = {
  checked?: boolean
}
export const letControlledChecked = createPlugin<SwitchProps & LetControlledChecked>(({ checked }) => {
  const switchController = useRef<SwitchController>()
  useLayoutEffect(() => {
    if (checked != null) switchController.current?.setChecked(checked)
  }, [checked])
  return {
    defaultChecked: checked,
    _lockSelf: checked != null,
    controller: switchController
  }
})
