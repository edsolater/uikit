import { Fragment, ReactNode } from 'react'
import { addPropsToReactElement } from '../functions/react'
import { DivProps } from './Div'

export type AddPropsProps<T> = { children?: ReactNode; key?: string | number } & Omit<T, 'children' | 'key'>

/**
 * @BaseUIComponent
 * it will merge props
 * !!! child must extends `<Div>`
 */
export function AddProps<T = DivProps>({ key, children, ...restProps }: AddPropsProps<T>) {
  return <Fragment key={key}>{addPropsToReactElement(children, restProps as any)}</Fragment>
}
