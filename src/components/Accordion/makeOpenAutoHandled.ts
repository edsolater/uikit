import { useToggle } from '../../hooks'
import { createPropPlugin } from '../../plugins'
import { AccordionProps } from './Accordion'

export type AutoHandleOpenPluginOptions = {
  defaultOpen?: boolean
}
/**
 * plugin for {@link Accordion}
 */
export const makeOpenAutoHandled = createPropPlugin(
  (oldProps: AccordionProps) => (options?: AutoHandleOpenPluginOptions) => {
    const [innerOpen, { toggle, off, on, set }] = useToggle(options?.defaultOpen ?? oldProps.open)
    return {
      onClose: off,
      onOpen: on,
      onToggle: toggle,
      open: innerOpen
    }
  }
)
