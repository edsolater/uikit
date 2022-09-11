import { Fragment, ReactNode } from 'react'
import { addPropsToReactElement } from '../functions/react'
import { Div } from './Div/Div'
import { DivProps } from './Div/type'

export type AddPropsProps<T> = { children?: ReactNode; key?: string | number } & Omit<T, 'children' | 'key'>

/**
 * @BaseUIComponent
 * it will merge props
 * !!! child must extends `<Div>`
 * ! if child is just a string, it will wrap a `<Div>`
 */
export function AddProps<T = DivProps>({ key, children, ...restProps }: AddPropsProps<T>) {
  return typeof children === 'string' ? (
    <Div key={key} {...restProps}>
      {children}
    </Div>
  ) : (
    <Fragment key={key}>{addPropsToReactElement(children, restProps as any)}</Fragment>
  )
}
