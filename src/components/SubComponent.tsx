import { Div } from './Div/Div'
import { DerivativeDivProps } from './Div/type'

export interface SubComponentProps extends DerivativeDivProps {
  childIsRoot?: boolean
}

export function SubComponent({ childIsRoot, ...divProps }: SubComponentProps) {
  return <Div {...divProps} />
}
