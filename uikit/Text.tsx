import Div, { DivProps } from './Div'

interface TextProps extends DivProps {}
export default function Text({ ...restProps }: TextProps) {
  return <Div nodeName='Text' {...restProps} />
}
