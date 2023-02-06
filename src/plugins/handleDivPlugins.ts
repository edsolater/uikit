import { omit } from '@edsolater/fnkit'
import { useEffect, useRef, useState } from 'react'
import { isPromise } from 'util/types'
import { DivProps } from '../Div/type'
import { parsePropPluginToProps } from './createPlugin'

export function handleDivPlugin<P extends Partial<DivProps>>(props?: P) {
  if (!props?.plugin) return props
  return omit(parsePropPluginToProps({ plugin: props.plugin, props }), 'plugin')
}


/**
 * **inner use react hook**
 */
export function handlePromiseProps(props: object) {
  // for friendlier error
  // TODO: imply this
  const promisedPropsKeys = useRef<string[]>(getPromiseKey(props))

  if (promisedPropsKeys.current.length === 0) return props
  const [parsedProps, setProps] = useState(props)
  const promisedProps = Object.entries(props).filter(([key, value]) => isPromise(value))
  for (const [promisedPropKey, promisedPropValue] of promisedProps) {
    useEffect(() => {
      promisedPropValue.then((value) => setProps((props) => ({ ...props, [promisedPropKey]: value })))
    }, [promisedPropValue])
  }
  return parsedProps
}

function getPromiseKey(props: object): string[] {
  return Object.entries(props)
    .filter(([key, value]) => isPromise(value))
    .map(([key]) => key)
}
