import { isString, overwriteFunctionName } from '@edsolater/fnkit'
import { RefObject, useRef } from 'react'
import { mergeProps } from '../../functions/react'
import { AddProps } from '../AddProps'
import { Div, DivProps } from '../Div'

type Component<Props> = (props: Props) => JSX.Element

type UIKitRootProps = DivProps & {
  /** @default 'Div' */
  use?: 'Div' | 'AddProps'
}

type UIKitRoot = (uikitProps: UIKitRootProps) => JSX.Element

export function uikit<T>(
  options: { name: string } | string,
  ComponentConstructerFn: (KitRoot: UIKitRoot) => Component<T>
): Component<T & Omit<DivProps, 'children'>> {
  const displayName = isString(options) ? options : options.name
  const uikitFC = overwriteFunctionName((props) => {
    const refedProps = useRef(props)
    const KitRoot = useRef(generateUIKitRoot(refedProps, displayName))
    return ComponentConstructerFn(KitRoot.current)(props) ?? null
  }, displayName)
  return uikitFC
}

function generateUIKitRoot(props: RefObject<DivProps>, displayName: string) {
  const KitRoot = ({ use, ...uikitProps }: UIKitRootProps) =>
    use === 'AddProps' ? (
      <AddProps {...mergeProps(props.current, uikitProps, { className: displayName })}>{uikitProps?.children}</AddProps>
    ) : (
      <Div {...mergeProps(props.current, uikitProps, { className: displayName })}>{uikitProps?.children}</Div>
    )
  return KitRoot
}
