import { Div, DivChildNode } from './Div'
import { Popover, PopoverProps } from './Popover/Popover'
import { uikit } from './utils'

export type TooltipProps = {
  name?: string
  renderButton?: DivChildNode
  renderTooltipContent?: DivChildNode
} & Omit<PopoverProps, 'renderButton' | 'renderPanel'>

export const Tooltip = uikit('Tooltip', (KitRoot) => (props: TooltipProps) => (
  <KitRoot>
    <Popover
      triggerBy='hover'
      {...props}
      renderPanel={
        <Div
          icss={{
            background: 'white',
            borderRadius: 8,
            boxShadow: '0px 4px 8px #0000004f',
            padding: 8
          }}
        >
          {props.renderTooltipContent}
        </Div>
      }
    />
  </KitRoot>
))
