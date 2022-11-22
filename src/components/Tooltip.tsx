import { Div, DivChildNode } from '../Div'
import { Popover, PopoverProps } from './Popover/Popover'
import { uikit } from './utils'

export type TooltipProps = {
  name?: string
  renderTooltipContent?: DivChildNode
  children?: TooltipProps['renderTooltipContent']
} & Omit<PopoverProps, 'renderPanel' | 'children'>

export const Tooltip = uikit('Tooltip', (KitRoot) => ({ children, renderTooltipContent, ...props }: TooltipProps) => (
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
          {renderTooltipContent ?? children}
        </Div>
      }
    />
  </KitRoot>
))
