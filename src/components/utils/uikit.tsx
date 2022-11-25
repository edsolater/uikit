import { isString, overwriteFunctionName } from '@edsolater/fnkit'
import { Div, DivProps } from '../../Div'
import { mergeProps } from '../../functions/react'
import { AddProps } from '../AddProps'

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
    const KitRoot = generateUIKitRoot(props, displayName)
    return ComponentConstructerFn(KitRoot)(props) ?? null
  }, displayName)
  return uikitFC
}

function generateUIKitRoot(props: DivProps, displayName: string) {
  const KitRoot = ({ use, ...uikitProps }: UIKitRootProps) =>
    use === 'AddProps' ? (
      <AddProps {...mergeProps(props, uikitProps, { className: displayName })}>{uikitProps?.children}</AddProps>
    ) : (
      <Div {...mergeProps(props, uikitProps, { className: displayName })}>{uikitProps?.children}</Div>
    )
  return KitRoot
}
