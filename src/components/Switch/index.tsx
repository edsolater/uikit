import { MayDeepArray, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode } from 'react'
import { Div, DivProps } from '../../Div'
import { useControllerRegister } from '../../hooks'
import { ICSS } from '../../styles'
import { ControllerRef } from '../../typings/tools'
import { createKit } from '../utils'
import { letDefaultCheck } from './plugins/letDefaultCheck'
import { letHandleSwitchKeyboardShortcut } from './plugins/letHandleSwitchKeyboardShortcut'
import { letSwitchStyle, SwitchVariables } from './plugins/letSwitchStyle'

export type SwitchController = {
  checked: boolean
  turnOn(): void
  turnOff(): void
  toggle(): void
  setChecked(to: boolean): void
}

export interface SwitchCoreProps {
  // -------- core --------
  checked?: boolean
  onToggle?: (toStatus: boolean) => void
  // -------- selfComponent --------
  controller?: MayDeepArray<ControllerRef<SwitchController>>
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
      turnOn() {
        innerController.setChecked(true)
      },
      turnOff() {
        innerController.setChecked(false)
      },
      toggle() {
        checked ? innerController.turnOff() : innerController.turnOn()
      },
      setChecked(to) {
        if (to !== Boolean(checked)) onToggle?.(to)
      }
    }
    console.log('5: ', 5)

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
  { plugin: [letSwitchStyle, letDefaultCheck, letHandleSwitchKeyboardShortcut] }
)
