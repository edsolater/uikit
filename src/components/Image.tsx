import { shakeFalsy } from '@edsolater/fnkit'
import React, { useEffect, useRef, useState } from 'react'
import { Div } from '../Div/Div'
import { DivProps } from '../Div/type'

/**
 * usually in the leading part of an list-item
 */
export function Image({
  src,
  fallbackSrc,
  alt: alert,
  ...divProps
}: {
  /**
   *  also accept multi srcs
   */
  src?: string | string[]
  fallbackSrc?: string
  /**
   *  for readability
   */
  alt?: string
} & DivProps<{}, 'img'>) {
  const ref = useRef<HTMLImageElement>(null)
  const srcSet = shakeFalsy([src, fallbackSrc].flat())
  const srcFingerprint = srcSet.join(' ')
  const [currentUsedSrcIndex, setCurrentUsedSrcIndex] = useState(0)
  const currentSrc = srcSet[currentUsedSrcIndex]
  const alertText = alert ?? getFileNameOfURI(currentSrc ?? '')

  useEffect(() => {
    setCurrentUsedSrcIndex(0)
  }, [srcFingerprint])

  useEffect(() => {
    ref.current?.addEventListener(
      'error',
      (ev) => {
        setCurrentUsedSrcIndex((n) => n + 1)
      },
      { capture: true }
    )
  }, [])
  return (
    <Div<{}, 'img'>
      as='img'
      shadowProps={divProps}
      domRef={ref}
      htmlProps={{ src: srcSet[currentUsedSrcIndex], alt: alertText }}
      icss={{ display: 'block', visibility: currentUsedSrcIndex >= srcSet.length ? 'hidden' : undefined }}
    />
  )
}

/**
 *
 * @param uri target
 * @returns shorter string
 * @example
 * getFileNameOfURI('https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9aPjLUGR9e6w6xU2NEQNtP3jg3mq2mJjSUZoQS4RKz35/dcash-logo.png') //=> 'dcash-logo'
 */

export function getFileNameOfURI(uri: string, { maxLength = 20 } = {}): string {
  const fileName = uri.split(/\//).reverse()[0]
  return fileName.replace(/\.\w+$/, '').slice(0, maxLength)
}
