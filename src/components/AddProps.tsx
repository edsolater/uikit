import { isNumber, isString } from '@edsolater/fnkit'
import { Div } from '../Div'
import { DivProps } from '../Div/type'
import { addPropsToReactElement } from '../utils/react/addPropsToReactElement'

type AddPropsProps = Omit<Partial<DivProps<any>>, 'children'> & { children?: any }

/**
 * @BaseUIComponent
 * it will merge props
 * if inner is string | number, it will wrap `<Div>`
 * !!! child must extends `<Div>`
 */
export function AddProps<T extends AddPropsProps = AddPropsProps>({ children, ...restProps }: T) {
  return isString(children) || isNumber(children) ? (
    <Div {...restProps}>{children}</Div>
  ) : (
    <>{addPropsToReactElement(children, restProps as Omit<Partial<DivProps>, 'children'>)}</>
  )
}
