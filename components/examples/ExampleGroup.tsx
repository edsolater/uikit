import type { DivProps } from '../../uikit/Div'
import Caption from '../../uikit/Caption'
import Div from '../../uikit/Div'
import Row from '../../uikit/Row'
import Text from '../../uikit/Text'

interface ExampleGroupProps extends DivProps {
  caption?: string
  explanation?: string
}
export default function ExampleGroup({
  caption,
  explanation,
  children,
  className,
  style,
  ...restProps
}: ExampleGroupProps) {
  return (
    <Div {...restProps} nodeName='ExampleGroup' className={className} style={[{ gridTemplateColumns: '' }, style]}>
      {caption && <Caption className='my-4 text-xl font-bold'>{caption}</Caption>}
      {explanation && <Text className='text-sm text-text-light text-opacity-60'>{explanation}</Text>}
      <Row>{children}</Row>
    </Div>
  )
}
