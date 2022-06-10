import Div, { DivProps } from '../Div'

export default function Screen(props: DivProps) {
  return (
    <Div
      {...props}
      icss_={[
        {
          display: 'grid',
          width: '100%',
          height: '100%'
        }
      ]}
    />
  )
}
