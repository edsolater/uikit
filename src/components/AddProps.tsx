import { Fragment } from 'react'
import { addPropsToReactElement } from '../functions/react'
import { DivProps } from '../Div/type'
import { handleDivShallowProps } from '../Div/utils/handleDivShallowProps'

type AddPropsProps = Omit<Partial<DivProps>, 'children'> & { children?: any }

/**
 * @BaseUIComponent
 * it will merge props
 * !!! child must extends `<Div>`
 */
export function AddProps<T extends AddPropsProps = AddPropsProps>({ children, ...restProps }: T) {
  //@ts-expect-error
  return <Fragment>{addPropsToReactElement(children, handleDivShallowProps(restProps))}</Fragment>
}
