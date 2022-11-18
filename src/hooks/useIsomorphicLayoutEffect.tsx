import { useEffect, useLayoutEffect } from 'react'
import { inClient } from '../utils/isSSR'

export const useIsomorphicLayoutEffect = inClient ? useLayoutEffect : useEffect
