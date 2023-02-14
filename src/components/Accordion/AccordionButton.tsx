import { assert, shrinkToValue } from '@edsolater/fnkit'
import { ReactNode } from 'react'
import { icssClickable } from '../../styles'
import { AddProps } from '../AddProps'
import { KitProps, useKitProps } from '../utils'
import { useAccordionContextProps } from './AccordionContext'
import { AccordionController } from './type'

type AccordionButtonProps = KitProps<{
  children?: ReactNode | ((open: boolean, controller: AccordionController) => ReactNode)
}>
export const AccordionButton = (inputProps: AccordionButtonProps) => {
  const [{ children }, divProps] = useKitProps(inputProps)
  const { controller, ...contextProps } = useAccordionContextProps()
  assert(controller, 'lack of accordion controller')
  return (
    <AddProps shadowProps={divProps} onClick={controller.toggle} icss={icssClickable}>
      {shrinkToValue(children, [Boolean(contextProps.open), controller])}
    </AddProps>
  )
}
