import { Fragment } from 'react'
import { addPropsToReactElement } from '../functions/react'
import { DerivativeDivProps, DivProps } from './Div/type'
import { mergeShallowProps as collapseShallowProps } from './Div/utils/mergeShallowProps'

export type AddPropsProps<T> = { children?: DivProps['children']; key?: string | number } & Omit<T, 'children' | 'key'>

/**
 * @BaseUIComponent
 * it will merge props
 * !!! child must extends `<Div>`
 * ! if child is just a string, it will wrap a `<Div>`
 */
export function AddProps<T = DerivativeDivProps>({ key, children, ...restProps }: AddPropsProps<T>) {
  return <Fragment key={key}>{addPropsToReactElement(children, collapseShallowProps(restProps) as any)}</Fragment>
}
