import { AnyFn, isObject, isPromise, map, omit, shrinkToValue } from '@edsolater/fnkit'
import { useEffect, useRef, useState } from 'react'
import { DivProps } from '../Div/type'
import { ValidPromisePropsConfig, ValidProps, ValidStatus } from '../typings/tools'
import { parsePropPluginToProps } from './createPlugin'

export function handleDivPlugin<P extends Partial<DivProps>>(props: P) {
  if (!props?.plugin) return props
  return omit(parsePropPluginToProps({ plugin: props.plugin, props }), 'plugin')
}

/**
 * **inner use react hook**
 */
export function handlePivPromiseProps(
  props: ValidProps,
  status: ValidStatus | undefined,
  promisePropsConfig: ValidPromisePropsConfig<ValidProps> | undefined
) {
  // for friendlier error
  // TODO: imply this
  const promisedPropsKeys = useRef<string[]>(getDivPromisePropsKey(props, status, promisePropsConfig)) // count is stable

  if (!promisePropsConfig && promisedPropsKeys.current.length === 0) return props

  const [parsedProps, setProps] = useState<ValidProps>(() => getInitProps(props, status, promisePropsConfig)) // cache for all props

  const promisedProps = Object.entries(props).filter(([key]) => promisedPropsKeys.current.includes(key)) // count is stable
  for (const [promisedPropKey, promisedPropValue] of promisedProps) {
    useEffect(() => {
      Promise.resolve(shrinkToValue(promisedPropValue, [status])).then((value) =>
        setProps((props) => ({ ...props, [promisedPropKey]: value }))
      )
    }, [promisedPropValue])
  }
  return parsedProps
}

function getDivPromisePropsKey(
  props: ValidProps,
  status: ValidStatus | undefined,
  promisePropsConfig: ValidPromisePropsConfig<ValidProps> | undefined
): string[] {
  const promisePropsKey = Object.entries(props)
    .filter(([key, value]) => {
      if (isFunctionKey(key, value) || isChildren(key, value) || isInnerKey(key, value)) return false
      const configPromiseFallback = promisePropsConfig?.[key + 'PromiseFallback']
      if (configPromiseFallback !== undefined) return true

      const configMayPromise = promisePropsConfig?.[key + 'MayPromise']
      if (configMayPromise !== undefined) return configMayPromise

      const valueIsPromise = isPromise(value)
      return valueIsPromise
    })
    .map(([key]) => key)
  return promisePropsKey
}

function isFunctionKey(key: any, value: any) {
  return String(key).startsWith('on') || String(key).startsWith('render') || String(key).startsWith('get')
}
function isChildren(key: any, value: any) {
  return String(key) === 'children'
}
function isInnerKey(key: any, value: any) {
  return String(key).startsWith('_')
}

function getInitProps(
  props: ValidProps,
  status: ValidStatus | undefined,
  promisePropsConfig: ValidPromisePropsConfig<ValidProps> | undefined
): ValidProps {
  const initProps = map(props, (value, key) => {
    if (isChildren(key, value) || isInnerKey(key, value)) return value
    if (isFunctionKey(key, value)) return injectStatusToFirstParam(value, status)
    const configMayPromise = promisePropsConfig?.[key + 'MayPromise']
    const configPromiseFallback = promisePropsConfig?.[key + 'PromiseFallback']
    const valueIsPromise = isPromise(value)

    const propsIsMayValue = Boolean(configPromiseFallback || configMayPromise || valueIsPromise)
    return propsIsMayValue ? configPromiseFallback : value
  })
  return initProps
}

function injectStatusToFirstParam(fn: AnyFn, status: ValidStatus | undefined) {
  return (...innerParams) => {
    if (innerParams.length === 0) return fn(status)
    if (isObject(innerParams[0])) return fn({ ...innerParams[0], status }, ...innerParams.slice(1))
    return fn(status, ...innerParams)
  }
}
