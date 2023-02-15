import { flapDeep, merge, shakeFalsy, shakeNil } from '@edsolater/fnkit'
import { parseCSS } from '../../styles/parseCSS'
import { invokeOnce } from '../../utils/dom/invokeOnce'
import { loadRef, mergeRefs } from '../../utils/react'
import classname from '../../utils/react/classname'
import { DivChildNode, DivProps } from '../type'

export function parseDivPropsToCoreProps(
  divProps: Omit<DivProps<any>, 'plugin' | 'tag' | 'shadowProps' | 'children'> & {
    children?: DivChildNode
  }
) {
  return {
    ...(divProps.htmlProps && Object.assign({}, ...shakeNil(flapDeep(divProps.htmlProps)))),
    class:
      shakeFalsy([classname(divProps.class), parseCSS(divProps.icss)]).join(' ') ||
      undefined /* don't render if empty string */,
    ref: (el) => el && invokeOnce(el, () => loadRef(mergeRefs(...flapDeep(divProps.domRef)), el)),
    style: divProps.style ? merge(...shakeNil(flapDeep(divProps.style))) : undefined,
    onClick: divProps.onClick ? (ev) => divProps.onClick?.({ ev, el: ev.currentTarget }) : undefined
  }
}
