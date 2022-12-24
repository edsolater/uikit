import { useToggle } from '../../../hooks'
import { createPlugin } from '../../../plugins'
import { AccordionProps } from '../Accordion'

export type LetAutoHandleOpenOptions = {
  defaultOpen?: boolean
}
/**
 * plugin for {@link Accordion}
 */
export const letOpenAutoHandled = createPlugin<AccordionProps & LetAutoHandleOpenOptions>((props) => {
  const [innerOpen, { toggle, off, on, set }] = useToggle(props?.defaultOpen ?? props.open)
  return {
    onClose: off,
    onOpen: on,
    open: innerOpen
  }
})
