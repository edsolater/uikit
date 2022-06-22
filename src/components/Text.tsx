import { Div, DivProps } from './Div'

// text is not like 
export interface TextProps extends DivProps {}
export function Text({ ...restProps }: TextProps) {
  return <Div className_='Text' {...restProps} />
}
