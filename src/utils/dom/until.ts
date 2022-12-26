import { shrinkToValue } from '@edsolater/fnkit'

/**
 *
 *
 * @param eventName
 * @param getObj
 * @returns
 */
export default async function until<O extends { addEventListener: any }>(eventName: string, getObj: () => O) {
  return new Promise((resolve) => {
    const obj = shrinkToValue(getObj)
    obj.addEventListener(eventName, (ev) => {
      resolve(ev)
    })
  })
}
