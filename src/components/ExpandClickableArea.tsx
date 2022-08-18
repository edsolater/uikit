import { AddProps } from './AddProps'
import { Div, DivProps } from './Div/Div'

/**
 * only block element \
 * use padding + margin
 */
export function ExpandClickableArea({
  expandPx = 8,
  dir = 'both',
  ...divProps
}: { expandPx?: number; dir?: 'x' | 'y' | 'both' } & DivProps) {
  return (
    <Div
      {...divProps}
      icss={[
        dir === 'both' && { padding: expandPx, margin: -expandPx },
        dir === 'x' && { paddingInline: expandPx, marginInline: -expandPx },
        dir === 'y' && { paddingBlock: expandPx, marginBlock: -expandPx },
        divProps.icss
      ]}
    />
  )
}
