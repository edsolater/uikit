import type { DivProps } from '../../uikit/Div'
import Div from '../../uikit/Div'
import Caption from '../../uikit/Caption'
import Row from '../../uikit/Row'

interface ExampleGroupProps extends DivProps {
  caption?: string
}
export default function ExampleGroup({ caption, children, className, style, ...restProps }: ExampleGroupProps) {
  return (
    <Div {...restProps} className={['ExampleGroup', className]} style={[{ gridTemplateColumns: '' }, style]}>
      {caption && <Caption className='my-4 text-xl font-bold'>{caption}</Caption>}
      <Row>{children}</Row>
    </Div>
  )
}
