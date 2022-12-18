import { mergeFunction } from '@edsolater/fnkit'
import { useState } from 'react'
import { Div, DivChildNode, DivProps } from '../Div'
import { click } from '../plugins'
import { mergeProps } from '../utils'
import { uikit } from './utils'

export interface SwitchCoreProps {
  checked?: boolean
  onToggle?: (toStatus: boolean) => void
  renderThumbIcon?: DivChildNode
  trackProps?: DivProps
  thumbProps?: DivProps
}

export type SwitchProps = SwitchCoreProps & FeatureDefaultCheck

export const Switch = uikit('Switch', (rawProps: SwitchProps) => {
  const p1 = useFeatureDefaultCheck(rawProps)
  const p = useFeatureBasicStyle(p1)
  const { checked, onToggle, renderThumbIcon, trackProps, thumbProps } = p
  return (
    <Div
      className='Switch-track'
      shadowProps={trackProps}
      plugin={click(() => {
        onToggle?.(!checked)
      })}
    >
      <Div className='Switch-thumb' shadowProps={thumbProps}>
        {renderThumbIcon}
      </Div>
    </Div>
  )
})

type FeatureDefaultCheck = {
  defaultCheck?: boolean
}
const useFeatureDefaultCheck = <T extends FeatureDefaultCheck & SwitchCoreProps>(
  props: T
): Omit<T, keyof FeatureDefaultCheck> => {
  const [isChecked, setIsChecked] = useState(props.defaultCheck)
  return {
    ...props,
    checked: isChecked,
    onToggle: mergeFunction(props.onToggle, (toStatus) => {
      setIsChecked(toStatus)
    })
  }
}

type FeatureBasicStyle = {}

const useFeatureBasicStyle = <T extends FeatureBasicStyle & SwitchCoreProps>(
  props: T
): Omit<T, keyof FeatureBasicStyle> => {
  const innerStyle = {
    thumbOuterWidth: 24,
    trackWidth: 2 * 24,
    checkedThumbColor: 'white',
    trackBorderColor: '#74796e',
    uncheckedThumbColor: '#74796e',
    checkedTrackBg: 'dodgerblue',
    uncheckedTrackBg: 'transparent',
    trackBorderWidth: 2
  }

  return mergeProps(props, {
    trackProps: {
      icss:{
        width: innerStyle.trackWidth,
        backgroundColor: props.checked ? innerStyle.checkedTrackBg : innerStyle.uncheckedTrackBg,
        border: `${innerStyle.trackBorderWidth}px solid ${innerStyle.trackBorderColor}`,
        borderRadius: '100vw',
        transition: '300ms'
      }
    },
    thumbProps: {
      icss: [
        {
          translate: props.checked ? `calc(100% - ${2 * innerStyle.trackBorderWidth}px)` : undefined,
          scale: props.checked ? '.8' : '.6',
          width: innerStyle.thumbOuterWidth,
          height: innerStyle.thumbOuterWidth,
          backgroundColor: props.checked ? innerStyle.checkedThumbColor : innerStyle.uncheckedThumbColor,
          borderRadius: '100vw'
        },
        { transition: '300ms' }
      ]
    }
  } as SwitchCoreProps)
}
