import { MayDeepArray, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode, useState } from 'react'
import { Div, DivProps } from '../../Div'
import { useControllerRegister, useRecordedEffect } from '../../hooks'
import { ICSS } from '../../styles'
import { ControllerRef } from '../../typings/tools'
import { createKit } from '../utils'
import { letControlledChecked } from './plugins/letControlledChecked'
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
  _lockSelf?: boolean
  defaultChecked?: boolean
  onToggle?: (toStatus: boolean) => void
  // -------- selfComponent --------
  controller?: MayDeepArray<ControllerRef<SwitchController>>
  componentId?: string
  // -------- sub --------
  renderThumbIcon?: MayFn<ReactNode, [utils: SwitchController]>
  anatomy?: {
    track?: MayFn<DivProps, [utils: SwitchController]>
    thumb?: MayFn<DivProps, [utils: SwitchController]>
  }

  // -------- enrich DivProps's icss --------
  icss?: ICSS<SwitchVariables>
}

export const Switch = createKit(
  'Switch',
  ({ _lockSelf, defaultChecked, onToggle, renderThumbIcon, anatomy, controller, componentId }: SwitchCoreProps) => {
    const [checked, _setChecked] = useState(Boolean(defaultChecked))
    function setChecked(dispatch: React.SetStateAction<boolean>) {
      if (!_lockSelf) _setChecked(dispatch)
    }

    const innerController: SwitchController = {
      checked,
      turnOn() {
        setChecked(true)
      },
      turnOff() {
        setChecked(false)
      },
      toggle() {
        setChecked((t) => !t)
      },
      setChecked(to) {
        setChecked(to)
      }
    }

    useRecordedEffect(
      ([prevChecked]) => {
        if (prevChecked != null && prevChecked != checked) onToggle?.(checked)
      },
      [checked]
    )

    if (controller) useControllerRegister(componentId, controller, innerController)

    return (
      <Div
        className='Switch-track'
        shadowProps={shrinkToValue(anatomy?.track, [innerController])}
        onClick={innerController.toggle}
      >
        <Div className='Switch-thumb' shadowProps={shrinkToValue(anatomy?.thumb, [innerController])}>
          {shrinkToValue(renderThumbIcon, [innerController])}
        </Div>
      </Div>
    )
  },
  { plugin: [letSwitchStyle, letControlledChecked, letHandleSwitchKeyboardShortcut] }
)
