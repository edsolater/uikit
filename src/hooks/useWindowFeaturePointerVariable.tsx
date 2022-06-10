import { useEffect } from 'react'

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

let pointerMoveIsAttached = false
/**
 * make `<html>` has '--pointer-x' and '--pointer-y' CSS variables
 */
export function useWindowFeaturePointerVariable() {
  useEffect(() => {
    if (pointerMoveIsAttached) return
    attachPointerMoveCSSVariable({
      onSuccess() {
        pointerMoveIsAttached = true
      }
    })
  }, [])
}
