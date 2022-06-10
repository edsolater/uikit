import Div, { DivProps } from './Div'

export interface TextProps extends DivProps {}
export default function Text({ ...restProps }: TextProps) {
  return <Div className_='Text' {...restProps} />
}
