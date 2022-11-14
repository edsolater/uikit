import { Div } from './Div/Div'
import { DerivativeDivProps } from './Div/type'

export interface SubComponentProps extends DerivativeDivProps {
  childIsRoot?: boolean
}

/**@deprecated no need this uikit*/
export function SubComponent({ childIsRoot, ...divProps }: SubComponentProps) {
  return <Div {...divProps} />
}
