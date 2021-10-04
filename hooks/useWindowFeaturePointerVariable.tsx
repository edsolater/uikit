import { useEffect } from 'react'

import { addGlobalFeatureTag, hasGlobalFeatureTag } from '../functions/dom/globalFeatureTag'
import useBFlag from './useBFlag'

function attachPointerMoveCSSVariable({ onSuccess }: { onSuccess?: () => void } = {}) {
  document.addEventListener(
    'pointermove',
    (ev) => {
      document.documentElement.style.setProperty('--pointer-x', String(ev.pageX))
      document.documentElement.style.setProperty('--pointer-y', String(ev.pageY))
    },
    { passive: true }
  )
  onSuccess?.()
}
/**
 *  app feature
 * useEffect like hooks
 */
export function useWindowFeaturePointerVariable() {
  const pointerIsOn = useBFlag(hasGlobalFeatureTag('top-pointer-variable'))

  useEffect(() => {
    if (pointerIsOn.isOn()) return
    attachPointerMoveCSSVariable({
      onSuccess() {
        pointerIsOn.on()
        addGlobalFeatureTag('top-pointer-variable')
      }
    })
  }, [])
}
