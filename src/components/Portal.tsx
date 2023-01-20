import { useIsomorphicLayoutEffect }from '../hooks'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { DivProps } from '../Div/type'
import { inClient } from '../utils/isSSR'
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
      popoverHTMLElement.style.setProperty('inset', '0')
      popoverHTMLElement.classList.add('self-pointer-events-none')
      popoverHTMLElement.dataset.zIndex = String(zIndex)
    }
    document.body.appendChild(popoverHTMLElement)
    insertPointerNone()
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

let inserted = false

function insertPointerNone() {
  if (!inClient) return
  if (inserted) return
  inserted = true
  const styleEl = document.createElement('style')

  // Append <style> element to <head>
  document.head.appendChild(styleEl)

  styleEl.sheet?.insertRule(`:where(.self-pointer-events-none) {pointer-events:none}`)
  styleEl.sheet?.insertRule(`:where(.self-pointer-events-none) * {pointer-events:initial}`) // :where() always has 0 specificity -- MDN
}
