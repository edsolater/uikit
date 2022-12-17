import { assert, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode } from 'react'
import { DivProps } from '../../Div/type'
import { icssClickable } from '../../styles'
import { AddProps } from '../AddProps'
import { componentKit } from '../utils'
import { useAccordionContextProps } from './AccordionContext'
import { AccordionController } from './type'

type AccordionButtonProps = Omit<DivProps, 'children'> & {
  children?: ReactNode | ((open: boolean, controller: AccordionController) => ReactNode)
}
export const AccordionButton = componentKit('AccordionButton', ({ children }: AccordionButtonProps) => {
  const { controller, ...contextProps } = useAccordionContextProps()
  assert(controller, 'lack of accordion controller')
  return (
    <AddProps onClick={controller.toggle} icss={icssClickable}>
      {shrinkToValue(children, [Boolean(contextProps.open), controller])}
    </AddProps>
  )
})
