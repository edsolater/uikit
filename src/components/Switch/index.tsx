import { MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode } from 'react'
import { Div, DivProps } from '../../Div'
import { click } from '../../plugins'
import { uikit } from '../utils'
import { letSwitchBasicStyle } from './plugins/letBasicStyle'
import { FeatureDefaultCheck, letDefaultCheck } from './plugins/letDefaultCheck'

export interface SwitchCoreProps {
  checked?: boolean
  onToggle?: (toStatus: boolean) => void
  renderThumbIcon?: MayFn<ReactNode>
  anatomy?: { // uikit/componentKit's prop:anatomy --- sub components props
    track?: DivProps
    thumb?: DivProps
  }
}

export type SwitchProps = SwitchCoreProps & FeatureDefaultCheck

export const Switch = uikit(
  'Switch',
  ({ checked, onToggle, renderThumbIcon, anatomy }: SwitchProps) => {
    return (
      <Div
        className='Switch-track'
        shadowProps={anatomy?.track}
        plugin={click(() => {
          onToggle?.(!checked)
        })}
      >
        <Div className='Switch-thumb' shadowProps={anatomy?.thumb}>
          {shrinkToValue(renderThumbIcon)}
        </Div>
      </Div>
    )
  },
  { propsPlugin: [letDefaultCheck(), letSwitchBasicStyle()] }
)
