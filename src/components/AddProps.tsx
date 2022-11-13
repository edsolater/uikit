import { Fragment, ReactNode } from 'react'
import { addPropsToReactElement } from '../functions/react'
import { Div } from './Div/Div'
import { DerivativeDivProps } from './Div/type'
import { mergeShallowProps } from './Div/utils/mergeShallowProps'

export type AddPropsProps<T> = { children?: ReactNode; key?: string | number } & Omit<T, 'children' | 'key'>

/**
 * @BaseUIComponent
 * it will merge props
 * !!! child must extends `<Div>`
 * ! if child is just a string, it will wrap a `<Div>`
 */
export function AddProps<T = DerivativeDivProps>({ key, children, ...restProps }: AddPropsProps<T>) {
  return typeof children === 'string' ? (
    <Div key={key} {...restProps}>
      {children}
    </Div>
  ) : (
    <Fragment key={key}>{addPropsToReactElement(children, mergeShallowProps(restProps) as any)}</Fragment>
  )
}
