import { isArray, isIterable, isPromise } from '@edsolater/fnkit'
import { ReactNode, useLayoutEffect, useState } from 'react'
import { DivChildNode } from '../type'

// export function useDivChildren(children: DivChildNode): ReactNode {
//   const [cachedChildren, setCachedChildren] = useState<ReactNode>(() =>
//     containOnlyReactNode(children) ? children : replacePromiseWithUndefined(children)
//   )
//   useLayoutEffect(() => {
//     setCachedChildren(containOnlyReactNode(children) ? children : replacePromiseWithUndefined(children))

//     // clean so old children will be GC
//     return () => {
//       setCachedChildren(undefined)
//     }
//   }, [children])
//   recursivelyExtractChildren(children, setCachedChildren)
//   return cachedChildren
// }

// function recursivelyExtractChildren(
//   children: DivChildNode,
//   setCachedChildren: React.Dispatch<React.SetStateAction<ReactNode>>
// ) {
//   if (isPromise(children)) {
//     children.then(setCachedChildren)
//   }
//   if (isIterable(children)) {
//     const childrenArray = isArray(children) ? children : [...children]
//     childrenArray.forEach((child) => recursivelyExtractChildren(child, setCachedChildren))
//   }
// }

// function containOnlyReactNode(children: DivChildNode): children is ReactNode {
//   if (isIterable(children)) {
//     return [...children].every(containOnlyReactNode)
//   } else {
//     return !isPromise(children)
//   }
// }

// /**
//  * @todo should use _promiseConfig, not undefined
//  */
// function replacePromiseWithUndefined(children: DivChildNode): ReactNode {
//   if (isIterable(children)) {
//     return [...children].map(replacePromiseWithUndefined)
//   } else {
//     return isPromise(children) ? undefined : children
//   }
// }
