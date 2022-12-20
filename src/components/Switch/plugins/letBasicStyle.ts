import { mergeProps } from '../../../Div/utils/mergeProps'
import { createPropPluginFn } from '../../../plugins'
import { SwitchCoreProps } from '../index'

type FeatureBasicStyle = {}


export const letSwitchBasicStyle = createPropPluginFn<SwitchCoreProps, [option?: FeatureBasicStyle]>(
  (props) => (options) => {
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
        icss: {
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
)
