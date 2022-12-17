import { assert, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode } from 'react'
import { Div } from '../../Div/Div'
import { DivProps } from '../../Div/type'
import { icssClickable } from '../../styles'
import { FadeIn } from '../FadeIn'
import { componentKit } from '../utils'
import { useAccordionContextProps } from './AccordionContext'
import { AccordionController } from './type'

export const AccordionPanel = componentKit('AccordionPanel', ({ children }: AccordionPanelProps) => {
  const { controller, ...contextProps } = useAccordionContextProps()
  assert(controller, 'lack of accordion controller')
  return (
    <FadeIn show={contextProps.open} duration={200} transitionPresets={[]}>
      <Div onClick={controller.toggle} icss={icssClickable}>
        {shrinkToValue(children, [Boolean(contextProps.open), controller])}
      </Div>
    </FadeIn>
  )
})

type AccordionPanelProps = DivProps & {
  children?: ReactNode | ((open: boolean, controller: AccordionController) => ReactNode)
}
