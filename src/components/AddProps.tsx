import { DivProps } from '../Div/type'
import { addPropsToReactElement } from '../functions/react'

type AddPropsProps = Omit<Partial<DivProps>, 'children'> & { children?: any }

/**
 * @BaseUIComponent
 * it will merge props
 * !!! child must extends `<Div>`
 */
export function AddProps<T extends AddPropsProps = AddPropsProps>({ children, ...restProps }: T) {
  return <>{addPropsToReactElement(children, restProps as Omit<Partial<DivProps>, 'children'>)}</>
}
