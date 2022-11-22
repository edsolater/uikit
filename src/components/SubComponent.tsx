import { Div } from '../Div/Div'
import { DivProps } from '../Div/type'

export interface SubComponentProps extends DivProps {
  childIsRoot?: boolean
}

/**@deprecated no need this uikit*/
export function SubComponent({ childIsRoot, ...divProps }: SubComponentProps) {
  return <Div {...divProps} />
}
