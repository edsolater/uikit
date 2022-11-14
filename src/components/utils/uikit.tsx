import { isString } from '@edsolater/fnkit'
import { FC, ReactNode } from 'react'
import { AddProps } from '../AddProps'
import { DerivativeDivProps } from '../Div'

export function uikit<InnerProps>(
  options:
    | {
        name: string
      }
    | string,
  ComponentConstructFn: (props: InnerProps & { children?: ReactNode }) => ReactNode
): FC<InnerProps & { children?: ReactNode } & DerivativeDivProps> {
  const uikitFC: FC<InnerProps & DerivativeDivProps> = (props) => (
    <AddProps {...props}>{ComponentConstructFn(props)}</AddProps>
  )
  const displayName = isString(options) ? options : options.name
  uikitFC.displayName = displayName
  return uikitFC
}
