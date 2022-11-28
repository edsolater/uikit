import { isString, overwriteFunctionName } from '@edsolater/fnkit'
import { useMemo } from 'react'
import { Div, DivChildNode, DivProps } from '../../Div'
import { mergeProps } from '../../functions/react'
import { AddProps } from '../AddProps'

type Component<Props> = (props: Props) => DivChildNode
type ReactComponent<Props> = (props: Props) => JSX.Element

type UIKitRootProps = DivProps & {
  /** @default 'Div' */
  use?: 'Div' | 'AddProps'
}

type UIKitRoot = (uikitProps: UIKitRootProps) => DivChildNode

export function uikit<T>(
  options: { name: string } | string,
  ComponentConstructerFn: Component<T>
): ReactComponent<T & Omit<DivProps, 'children'>> {
  const displayName = isString(options) ? options : options.name
  const uikitFC = overwriteFunctionName((props) => {
    return (
      <AddProps {...mergeProps(props, { className: displayName })}>{ComponentConstructerFn(props) ?? null}</AddProps>
    )
  }, displayName)
  return uikitFC
}

function generateUIKitRoot(props: DivProps, displayName: string) {
  console.log('props: ', props)
  const KitRoot = ({ use, ...uikitProps }: UIKitRootProps) =>
    use === 'AddProps' ? (
      <AddProps {...mergeProps(props, uikitProps, { className: displayName })}>{uikitProps?.children}</AddProps>
    ) : (
      <Div {...mergeProps(props, uikitProps, { className: displayName })}>{uikitProps?.children}</Div>
    )
  return KitRoot
}
