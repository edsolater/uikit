import { useIsomorphicLayoutEffect } from '@edsolater/hookit'
import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { DivProps } from '../../dist'
import { inClient } from '../functions/isSSR'
import { AddProps } from './AddProps'

type PortalProps = {
  id: string
  zIndex?: number
} & DivProps

export function Portal({ id: portalId, zIndex, ...divProps }: PortalProps) {
  const [mounted, setMounted] = useState(false)

  // create stack element if not exist
  useIsomorphicLayoutEffect(() => {
    const alreadyExistPopoverStack = Boolean(document.getElementById(portalId))
    if (alreadyExistPopoverStack) return
    const popoverHTMLElement = document.createElement('div')
    popoverHTMLElement.id = portalId
    if (zIndex != null) {
      popoverHTMLElement.style.setProperty('position', 'absolute')
      popoverHTMLElement.style.setProperty('z-index', String(zIndex))
      popoverHTMLElement.dataset.zIndex = String(zIndex)
    }
    document.body.appendChild(popoverHTMLElement)
  }, [])

  // createProtal after mounted
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  return mounted && inClient && document.getElementById(portalId)
    ? createPortal(<AddProps {...divProps} />, document.getElementById(portalId)!)
    : null
}
