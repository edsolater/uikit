import { isString } from '@edsolater/fnkit'
import { FC, ReactNode } from 'react'
import { mergeProps } from '../../functions/react'
import { Div, DivProps } from '../Div'

export function uikit<InnerProps>(
  options: { name: string } | string,
  ComponentConstructFn: (
    KitRoot: (uikitProps?: DivProps) => JSX.Element,
    props: InnerProps & { children?: ReactNode }
  ) => JSX.Element
): FC<InnerProps & { children?: ReactNode } & DivProps> {
  const uikitFC: FC<InnerProps & DivProps> = (props) => {
    const KitRoot = generateUIKitRoot(props)
    return ComponentConstructFn(KitRoot, props) ?? null
  }
  const displayName = isString(options) ? options : options.name
  uikitFC.displayName = displayName
  return uikitFC
}

function generateUIKitRoot(props: DivProps) {
  const KitRoot = (uikitProps?: DivProps) => <Div {...mergeProps(props, uikitProps)}>{uikitProps?.children}</Div>
  return KitRoot
}
