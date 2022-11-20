import { Div, DivChildNode } from './Div'
import { Popover, PopoverProps } from './Popover/Popover'
import { uikit } from './utils'

export type TooltipProps = {
  name?: string
  renderTooltipContent?: DivChildNode
} & Omit<PopoverProps, 'renderPanel'>

export const Tooltip = uikit('Tooltip', (KitRoot) => (props: TooltipProps) => (
  <KitRoot>
    <Popover
      triggerBy='hover'
      placement='top'
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
