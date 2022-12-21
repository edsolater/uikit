import { MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode } from 'react'
import { Div, DivProps } from '../../Div'
import { click } from '../../plugins'
import { uikit } from '../utils'
import { letSwitchStyle, SwitchVariables } from './plugins/letSwitchStyle'
import { FeatureDefaultCheck, letDefaultCheck } from './plugins/letDefaultCheck'

export interface SwitchCoreProps {
  checked?: boolean
  onToggle?: (toStatus: boolean) => void

  renderThumbIcon?: MayFn<ReactNode>
  
  // uikit/componentKit's prop:anatomy --- sub components props
  anatomy?: {
    track?: DivProps
    thumb?: DivProps
  }
  // uikit/componentKit's prop:cssVariables --- this kit's cssVariables
  cssVariables?: SwitchVariables
}

export type SwitchProps = SwitchCoreProps & FeatureDefaultCheck

export const Switch = uikit(
  'Switch',
  ({ checked, onToggle, renderThumbIcon, anatomy, cssVariables }: SwitchProps) => {
    return (
      <Div
        icss={cssVariables}
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
  { propsPlugin: [letDefaultCheck(), letSwitchStyle()] }
)
