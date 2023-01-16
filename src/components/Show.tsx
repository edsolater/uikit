import { shrinkToValue } from '@edsolater/fnkit'
import { DivProps } from '../Div'
import { AddProps } from './AddProps'
import { createKit } from './utils'

export interface ShowProps<T extends any> extends Omit<DivProps, 'children'> {
  when: T | undefined | null | false
  fallback?: JSX.Element
  children: JSX.Element | ((item: T) => JSX.Element)
}

export const Show = createKit('Show', <T extends any>({ when, fallback, children, ...props }: ShowProps<T>) => {
  return <AddProps {...props}>{when ? shrinkToValue(children, [when]) : fallback ?? null}</AddProps>
})
