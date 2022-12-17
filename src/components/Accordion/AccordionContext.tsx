import { createComponentContext } from '../utils'
import { AccordionController } from './type'
import { AccordionProps } from './Accordion'

export const [AccordionContextProvider, [useAccordionContextProps]] = createComponentContext<
  Omit<AccordionProps, 'children'> & { controller?: AccordionController }
>({})
