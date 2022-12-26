import { mergeFunction } from '@edsolater/fnkit'
import { useState } from 'react'
import { createPlugin} from '../../../plugins'
import { SwitchCoreProps } from '../index'

export type LetDefaultCheck = {
  defaultCheck?: boolean
}
export const letDefaultCheck = createPlugin<SwitchCoreProps & LetDefaultCheck>((props) => {
  const [isChecked, setIsChecked] = useState(props?.defaultCheck)
  return {
    checked: isChecked,
    onToggle: mergeFunction(props.onToggle, (toStatus) => {
      setIsChecked(toStatus)
    })
  }
})
