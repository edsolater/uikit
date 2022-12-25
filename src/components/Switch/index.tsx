import { MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode, RefObject } from 'react'
import { Div, DivProps } from '../../Div'
import { useControllerRegister } from '../../hooks'
import { ICSS } from '../../styles'
import { ControllerRef } from '../../typings/tools'
import { createKit } from '../utils'
import { letDefaultCheck } from './plugins/letDefaultCheck'
import { letSwitchStyle, SwitchVariables } from './plugins/letSwitchStyle'

export type SwitchController = {
  checked: boolean
  setChecked(to: boolean): void
}

export interface SwitchCoreProps {
  // -------- core --------
  checked?: boolean
  onToggle?: (toStatus: boolean) => void
  // -------- selfComponent --------
  controller?: ControllerRef<SwitchController>
  componentId?: string
  // -------- sub --------
  render?: {
    thumbIcon?: MayFn<ReactNode, [utils: SwitchController]>
  }
  anatomy?: {
    track?: MayFn<DivProps, [utils: SwitchController]>
    thumb?: MayFn<DivProps, [utils: SwitchController]>
  }

  // -------- enrich DivProps's icss --------
  icss?: ICSS<SwitchVariables>
}

export const Switch = createKit(
  'Switch',
  ({ checked, onToggle, render, anatomy, controller, componentId }: SwitchCoreProps) => {
    const innerController: SwitchController = {
      checked: Boolean(checked),
      setChecked(to) {
        if (to !== Boolean(checked)) onToggle?.(to)
      }
    }
    if (controller) useControllerRegister(componentId, controller, innerController)
    
    return (
      <Div
        className='Switch-track'
        shadowProps={shrinkToValue(anatomy?.track, [innerController])}
        onClick={() => {
          onToggle?.(!innerController.checked)
        }}
      >
        <Div className='Switch-thumb' shadowProps={shrinkToValue(anatomy?.thumb, [innerController])}>
          {shrinkToValue(render?.thumbIcon, [innerController])}
        </Div>
      </Div>
    )
  },
  { plugin: [letSwitchStyle, letDefaultCheck] }
)
