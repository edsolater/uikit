import { mergeFunction } from '@edsolater/fnkit'
import { useState } from 'react'
import { createPropPluginFn } from '../../../plugins'
import { SwitchCoreProps } from '../index'

export type FeatureDefaultCheck = {
  defaultCheck?: boolean
}
export const letDefaultCheck = createPropPluginFn<SwitchCoreProps, [option?: FeatureDefaultCheck]>(
  (props) => (options) => {
    const [isChecked, setIsChecked] = useState(options?.defaultCheck)
    return {
      checked: isChecked,
      onToggle: mergeFunction(props.onToggle, (toStatus) => {
        console.log('33: ', 33) // why log twice?
        setIsChecked(toStatus)
      })
    }
  }
)