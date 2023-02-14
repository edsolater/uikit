import { Div } from '../Div'
import { KitProps, useKitProps } from './utils'

export type ColProps = KitProps<{
  wrap?: boolean
  name?: string // same as `<Group>`'s grid
  /**@default 'md' */
  gap?: 'sm' /* 4px */ | 'md' /* 8px */ | 'lg' /* 16px */ | 'xl' /* 32px */
}>

/**
 * flex box
 */
export const Col = (props: ColProps) => {
  const [{ wrap, gap, children }, divProps] = useKitProps(props)
  return (
    <Div
      shadowProps={divProps}
      icss={{
        display: 'flex',
        flexDirection: 'column',
        flexWrap: wrap ? 'wrap' : undefined,
        gap: gap === 'xl' ? 32 : gap === 'lg' ? 16 : gap === 'sm' ? 4 : 8
      }}
    >
      {children}
    </Div>
  )
}
