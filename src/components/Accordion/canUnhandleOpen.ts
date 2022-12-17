import { useToggle } from '../../hooks'
import { createComponentPropsPlugin } from '../utils'
import { AccordionProps } from './Accordion'

type UnhandleOpenOptions = {
  defaultOpen?: boolean
}
/**
 * plugin for {@link Accordion}
 */
export const canUnhandleOpen = createComponentPropsPlugin(
  (oldProps: AccordionProps) => (options?: UnhandleOpenOptions) => {
    const [innerOpen, { toggle, off, on, set }] = useToggle(options?.defaultOpen ?? oldProps.open)
    return {
      onClose: off,
      onOpen: on,
      onToggle: toggle,
      open: innerOpen
    }
  }
)
