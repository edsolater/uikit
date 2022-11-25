import { useMedia } from './useMedia'

const breakPointsconfigs = {
  isPc: '(min-width: 640px)',
  isMobile: '(max-width: 640px)'
}

export function useDevice() {
  const currentBreakPoint = useMedia(
    Object.values(breakPointsconfigs),
    Object.keys(breakPointsconfigs) as (keyof typeof breakPointsconfigs)[],
    'isPc'
  )
  return { isMobile: currentBreakPoint === 'isMobile' }
}
