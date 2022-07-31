import { shrinkToValue } from '@edsolater/fnkit'
import { useClickOutside, useIsomorphicLayoutEffect, useToggle } from '@edsolater/hookit'
import { ReactNode, useMemo, useRef } from 'react'
import { pickChildByType } from '../functions/react'
import { icssClickable } from '../styles'
import { AddProps } from './AddProps'
import { Div, DivProps } from './Div/Div'
import { FadeIn } from './FadeIn'

type CollapseController = {
  open: () => void
  close: () => void
  toggle: () => void
}
interface CollapseProps extends DivProps {
  /** only first render */
  defaultOpen?: boolean
  /** it's change will cause ui change */
  open?: boolean
  /** (maybe not have to this, cause writing of collapseFace and collapseBody can express this ) */
  openDirection?: 'downwards' /* defaultValue */ | 'upwards'
  onOpen?(): void
  onClose?(): void
  onToggle?(): void
  closeByOutsideClick?: boolean
}

/**
 * default **uncontrolled** Kit
 */
export function Collapse({
  children,

  defaultOpen,
  open,
  openDirection = 'downwards',
  onOpen,
  onClose,
  onToggle,
  closeByOutsideClick,
  ...divProps
}: CollapseProps) {
  const collapseBodyRef = useRef<HTMLDivElement>(null)
  const collapseRef = useRef<HTMLDivElement>(null)

  const [innerOpen, { toggle, off, on, set }] = useToggle(defaultOpen, {
    onOff: onClose,
    onOn: onOpen,
    onToggle: onToggle
  })

  useIsomorphicLayoutEffect(() => {
    set(Boolean(open))
  }, [open])

  const controller = useMemo<CollapseController>(
    () => ({
      open: on,
      close: off,
      toggle: toggle
    }),
    [on, off]
  )

  useClickOutside(collapseRef, { disable: !closeByOutsideClick, onClickOutSide: off })

  return (
    <Div {...divProps} domRef_={collapseRef} className_='Collapse' icss_={{ display: 'flex', flexDirection: 'column' }}>
      <AddProps<CollapseFaceProps> onClick={toggle} icss={icssClickable} $open={innerOpen} $controller={controller}>
        {pickChildByType(children, CollapseFace)}
      </AddProps>
      <FadeIn show={innerOpen} duration={200} transitionPresets={[]}>
        <AddProps<CollapseBodyProps> domRef={collapseBodyRef} $open={innerOpen} $controller={controller}>
          {pickChildByType(children, CollapseBody)}
        </AddProps>
      </FadeIn>
    </Div>
  )
}

type CollapseFaceProps = Omit<DivProps, 'children'> & {
  children?: ReactNode | ((open: boolean, controller: CollapseController) => ReactNode)
  $open?: boolean
  $controller?: CollapseController
}

export function CollapseFace(props: CollapseFaceProps) {
  return (
    <Div className_='CollapseFace' {...props}>
      {shrinkToValue(props.children, [Boolean(props.$open), props.$controller!])}
    </Div>
  )
}
type CollapseBodyProps = DivProps & {
  children?: ReactNode | ((open: boolean, controller: CollapseController) => ReactNode)
  $open?: boolean
  $controller?: CollapseController
}

export function CollapseBody(props: CollapseBodyProps) {
  return (
    <Div className_='CollapseBody' {...props}>
      {shrinkToValue(props.children, [Boolean(props.$open), props.$controller!])}
    </Div>
  )
}

Collapse.Face = CollapseFace
Collapse.Body = CollapseBody
