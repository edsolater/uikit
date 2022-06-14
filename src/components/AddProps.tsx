import { Fragment, ReactNode } from 'react'
import { addPropsToReactNode } from '../functions/react'
import { DivProps } from './Div'

export type AddPropsProps<T> = { children?: ReactNode; key?: string | number } & Omit<T, 'children' | 'key'>

/**
 * @BaseUIComponent
 * it will merge props
 */
export function AddProps<T = DivProps>({ key, children, ...restProps }: AddPropsProps<T>) {
  return <Fragment key={key}>{addPropsToReactNode(children, restProps)}</Fragment>
}
