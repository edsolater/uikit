import { useState } from 'react'
import { Div } from '../Div'
import { click } from '../plugins'
import { uikit } from './utils'

export interface SwitchProps {
  disable?: boolean
  checked?: boolean
  onToggle?: (toStatus: boolean) => void
}

export const Switch = uikit('Switch', ({ checked, disable, onToggle }: SwitchProps) => {
  const thumbOuterWidth = 24
  const trackWidth = 2 * thumbOuterWidth

  const checkedThumbColor = 'white'
  const trackBorderColor = '#74796e'
  const uncheckedThumbColor = '#74796e'
  const checkedTrackBg = 'dodgerblue'
  const uncheckedTrackBg = 'transparent'
  const trackBorderWidth = '2px'

  return (
    <Div
      plugins={click(() => {
        onToggle?.(!checked)
      })}
      icss={{
        width: trackWidth,
        backgroundColor: checked ? checkedTrackBg : uncheckedTrackBg,
        border: `${trackBorderWidth} solid ${trackBorderColor}`,
        borderRadius: '100vw',
        transition: '300ms'
      }}
    >
      <Div
        icss={[
          {
            translate: checked ? '100%' : undefined,
            scale: checked ? 1 : 0.8,
            width: thumbOuterWidth,
            height: thumbOuterWidth,
            backgroundColor: checked ? checkedThumbColor : uncheckedThumbColor,
            borderRadius: '100vw'
          },
          { transition: '300ms' }
        ]}
      />
    </Div>
  )
})

export const UncontrolledSwitch = uikit('UncontrolledSwitch', ({ defaultCheck }: { defaultCheck?: boolean }) => {
  const [isChecked, setIsChecked] = useState(defaultCheck)
  return (
    <Switch
      checked={isChecked}
      onToggle={(toStatus) => {
        setIsChecked(toStatus)
      }}
    />
  )
})

// export const SwitchUncontrolWrapper =uikit('SwitchUncontrolWrapper', ()=>{
//   // TODO: createWrapper
//   return
// })
