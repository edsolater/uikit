import { useClickOutside }from '../../hooks'
import { useMemo, useRef } from 'react'
import { Div } from '../../Div/Div'
import { DivProps } from '../../Div/type'
import { createKit } from '../utils'
import { AccordionContextProvider } from './AccordionContext'
import { AccordionController } from './type'

export interface AccordionProps extends DivProps {
  /** it's change will cause ui change */
  open?: boolean
  /** (maybe not have to this, cause writing of accordionFace and accordionBody can express this ) */
  direction?: 'downwards' /* defaultValue */ | 'upwards'
  onOpen?(): void
  onClose?(): void
  onToggle?(): void
  closeByOutsideClick?: boolean
}
/**
 * default **uncontrolled** kit
 */

export const Accordion = createKit('Accordion', (props: AccordionProps) => {
  const { children, open, direction = 'downwards', onOpen, onClose, onToggle, closeByOutsideClick, ...divProps } = props
  const accordionRef = useRef<HTMLDivElement>(null)

  const on = () => onOpen?.()
  const off = () => onClose?.()
  const toggle = () => {
    if (open) on?.()
    if (!open) off?.()
    onToggle?.()
  }
  const set = (isOn: boolean) => (isOn ? on() : off())

  const controller = useMemo<AccordionController>(
    () => ({
      open: on,
      close: off,
      toggle,
      set
    }),
    [on, off]
  )

  useClickOutside(accordionRef, { disable: !closeByOutsideClick, onClickOutSide: off })

  return (
    <Div shadowProps={divProps} domRef={accordionRef} icss={{ display: 'flex', flexDirection: 'column' }}>
      <AccordionContextProvider {...props} controller={controller}>
        {children}
      </AccordionContextProvider>
    </Div>
  )
})
