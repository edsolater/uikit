import { assert, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode } from 'react'
import { Div } from '../../Div'
import { DivProps } from '../../Div/type'
import { FadeIn } from '../FadeIn'
import { createKit } from '../utils'
import { useAccordionContextProps } from './AccordionContext'
import { AccordionController } from './type'

export const AccordionPanel = createKit('AccordionPanel', ({ children }: AccordionPanelProps) => {
  const { controller, ...contextProps } = useAccordionContextProps()
  assert(controller, 'lack of accordion controller')
  return (
    <FadeIn show={contextProps.open} duration={200} transitionPresets={[]}>
      <Div>{shrinkToValue(children, [Boolean(contextProps.open), controller])}</Div>
    </FadeIn>
  )
})

type AccordionPanelProps = DivProps & {
  children?: ReactNode | ((open: boolean, controller: AccordionController) => ReactNode)
}
