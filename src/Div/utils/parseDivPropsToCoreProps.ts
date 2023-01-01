import { flapDeep, isObject, merge, shakeFalsy, shakeNil, shrinkToValue } from '@edsolater/fnkit'
import { invokeOnce } from '../../utils/dom/invokeOnce'
import { parseCSS } from '../../styles/parseCSS'
import { DivProps } from '../type'
import classname from '../../utils/react/classname'
import { loadRef, mergeRefs, shrinkMayRef } from '../../utils/react'

export function parseDivPropsToCoreProps(
  divProps: Omit<DivProps<any>, 'plugin' | 'tag' | 'shadowProps' | 'children'> & {
    children?: React.ReactNode
  }
) {
  const statusObject = isObject(divProps._statusObj) ? divProps._statusObj : undefined
  return {
    ...(divProps.htmlProps &&
      Object.assign({}, ...shakeNil(flapDeep(divProps.htmlProps)).map((i) => shrinkToValue(i, [statusObject])))),
    className:
      shakeFalsy([classname(divProps.className), parseCSS(divProps.icss, statusObject)]).join(' ') ||
      undefined /* don't render if empty string */,
    ref: (el) => el && invokeOnce(el, () => loadRef(mergeRefs(...flapDeep(divProps.domRef)), el)),
    style: divProps.style
      ? merge(...shakeNil(flapDeep(divProps.style)).map((i) => shrinkToValue(i, [statusObject])))
      : undefined,
    onClick: divProps.onClick
      ? (ev) =>
          flapDeep([divProps.onClick]).map((onClick) =>
            onClick?.({ event: ev, ev, el: ev.currentTarget, ...statusObject })
          )
      : undefined
  }
}
