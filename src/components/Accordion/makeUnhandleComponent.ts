import { useToggle } from '../../hooks'
import { createComponentPlugin } from '../utils'
import { AccordionProps } from './Accordion'

export type UnhandlePluginOptions = {
  defaultOpen?: boolean
}
/**
 * plugin for {@link Accordion}
 */
export const makeUnhandleComponent = createComponentPlugin(
  (oldProps: AccordionProps) => (options?: UnhandlePluginOptions) => {
    const [innerOpen, { toggle, off, on, set }] = useToggle(options?.defaultOpen ?? oldProps.open)
    return {
      onClose: off,
      onOpen: on,
      onToggle: toggle,
      open: innerOpen
    }
  }
)
