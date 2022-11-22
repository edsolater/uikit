import { Div } from '../Div/Div'
import { DivProps } from '../Div/type'

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
