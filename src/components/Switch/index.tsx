import { MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode } from 'react'
import { Div, DivProps } from '../../Div'
import { click } from '../../plugins'
import { createKit } from '../utils'
import { letSwitchStyle, SwitchVariables } from './plugins/letSwitchStyle'
import { FeatureDefaultCheck, letDefaultCheck } from './plugins/letDefaultCheck'
import { ICSS } from '../../styles'

export type SwitchStatus = {
  checked: boolean
}

export interface SwitchCoreProps {
  // -------- core --------
  checked?: boolean
  onToggle?: (toStatus: boolean) => void

  // -------- sub --------
  render?: {
    thumbIcon?: MayFn<ReactNode, [utils: SwitchStatus]>
  }
  anatomy?: {
    track?: MayFn<DivProps, [utils: SwitchStatus]>
    thumb?: MayFn<DivProps, [utils: SwitchStatus]>
  }

  // -------- enrich DivProps's icss --------
  icss?: ICSS<SwitchVariables>
}

export type SwitchProps = SwitchCoreProps & FeatureDefaultCheck

export const Switch = createKit(
  'Switch',
  ({ checked, onToggle, render, anatomy }: SwitchProps) => {
    const status = {
      checked: Boolean(checked)
    }
    return (
      <Div
        className='Switch-track'
        shadowProps={shrinkToValue(anatomy?.track, [status])}
        onClick={() => {
          onToggle?.(!status.checked)
        }}
      >
        <Div className='Switch-thumb' shadowProps={shrinkToValue(anatomy?.thumb, [status])}>
          {shrinkToValue(render?.thumbIcon, [status])}
        </Div>
      </Div>
    )
  },
  { plugin: [letDefaultCheck, letSwitchStyle] }
)
