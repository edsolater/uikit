import { useIsomorphicLayoutEffect } from '@edsolater/hookit'
import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { inClient } from '../functions/isSSR'

export function Portal({ id: portalId, children }: { id: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  // create stack element if not exist
  useIsomorphicLayoutEffect(() => {
    const alreadyExistPopoverStack = Boolean(document.getElementById(portalId))
    if (alreadyExistPopoverStack) return
    const popoverHTMLElement = document.createElement('div')
    popoverHTMLElement.id = portalId
    document.body.appendChild(popoverHTMLElement)
  }, [])

  // createProtal after mounted
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  return mounted && inClient && document.getElementById(portalId)
    ? createPortal(children, document.getElementById(portalId)!)
    : null
}
