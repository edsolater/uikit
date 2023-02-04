import { MayFn, MayPromise } from '@edsolater/fnkit'
import { DivChildNode } from '../Div'
import { useAsyncValue } from '../hooks'
import { createKit } from './utils'

/**
 * no props, just a wrapper
 * make async more convenient
 */
export const Async = createKit('Async', ({ children }: { children: MayFn<MayPromise<DivChildNode>> }) => {
  const innerChildren = useAsyncValue(children)
  return innerChildren
})
