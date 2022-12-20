import { Div, DivChildNode, DivProps } from '../../Div'
import { click } from '../../plugins'
import { uikit } from '../utils'
import { letSwitchBasicStyle } from './plugins/letBasicStyle'
import { FeatureDefaultCheck, letDefaultCheck } from './plugins/letDefaultCheck'

export interface SwitchCoreProps {
  checked?: boolean
  onToggle?: (toStatus: boolean) => void
  renderThumbIcon?: DivChildNode
  trackProps?: DivProps
  thumbProps?: DivProps
}

export type SwitchProps = SwitchCoreProps & FeatureDefaultCheck

export const Switch = uikit(
  'Switch',
  ({ checked, onToggle, renderThumbIcon, trackProps, thumbProps }: SwitchProps) => {
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
  },
  { propsPlugin: [letDefaultCheck(), letSwitchBasicStyle()] }
)
