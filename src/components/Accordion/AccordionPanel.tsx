import { assert, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode } from 'react'
import { Div } from '../../Div'
import { DivProps } from '../../Div/type'
import { FadeIn } from '../FadeIn'
import { useKitProps } from '../utils'
import { useAccordionContextProps } from './AccordionContext'
import { AccordionController } from './type'

type AccordionPanelProps = DivProps & {
  children?: ReactNode | ((open: boolean, controller: AccordionController) => ReactNode)
}

export const AccordionPanel = (inputProps: AccordionPanelProps) => {
  const [{ children }, divProps] = useKitProps(inputProps)
  const { controller, ...contextProps } = useAccordionContextProps()
  assert(controller, 'lack of accordion controller')
  return (
    <FadeIn show={contextProps.open} shadowProps={divProps} duration={200} transitionPresets={[]}>
      <Div>{shrinkToValue(children, [Boolean(contextProps.open), controller])}</Div>
    </FadeIn>
  )
}
