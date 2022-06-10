import { useEffect, useLayoutEffect } from 'react'
import { inClient } from '../functions/isSSR'

export const useIsomorphicLayoutEffect = inClient ? useLayoutEffect : useEffect
