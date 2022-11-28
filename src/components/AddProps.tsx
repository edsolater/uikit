import { pipe } from '@edsolater/fnkit'
import { Fragment } from 'react'
import { DivProps } from '../Div/type'
import { handleDivChildren } from '../Div/utils/handleDivChildren'
import { handleDivPropHook } from '../Div/utils/handleDivPropHook'
import { handleDivShallowProps } from '../Div/utils/handleDivShallowProps'
import { handleDivTag } from '../Div/utils/handleDivTag'
import { addPropsToReactElement } from '../functions/react'
import { handleDivNormalPlugins, splitPropPlugins } from '../plugins/handleDivPlugins'

type AddPropsProps = Omit<Partial<DivProps>, 'children'> & { children?: any }

/**
 * @BaseUIComponent
 * it will merge props
 * !!! child must extends `<Div>`
 */
export function AddProps<T extends AddPropsProps = AddPropsProps>({ children, ...restProps }: T) {
  const { props: parsedProps, normalPlugins } = splitPropPlugins(restProps)
  const mergedProps = pipe(
    parsedProps,
    handleDivShallowProps,
    handleDivNormalPlugins(normalPlugins),
    handleDivChildren,
    handleDivTag,
    handleDivPropHook
  )
  return <Fragment>{addPropsToReactElement(children, mergedProps)}</Fragment> // TODO: maybe it's good to merge logic into `<Div>`
}
