import { Fragment } from 'react'
import { addPropsToReactElement } from '../functions/react'
import { DerivativeDivProps, DivProps, ShallowDivProps } from './Div/type'
import { mergeShallowProps as collapseShallowProps } from './Div/utils/mergeShallowProps'

export type AddPropsProps<T> = { children?: DivProps['children'] } & Omit<T, 'children'>

/**
 * @BaseUIComponent
 * it will merge props
 * !!! child must extends `<Div>`
 */
export function AddProps<T = DerivativeDivProps & ShallowDivProps>({ children, ...restProps }: AddPropsProps<T>) {
  return <Fragment>{addPropsToReactElement(children, collapseShallowProps(restProps) as any)}</Fragment>
}
