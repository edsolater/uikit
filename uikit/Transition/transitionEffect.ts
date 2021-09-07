export type TransitionEffectClasses = {
  enter: string
  enterFrom: string
  enterTo: string
  leave: string
  leaveFrom: string
  leaveTo: string
}

export type TransitionEffectLabel = 'fade-in/fade-out' | 'from-left'

/** helper for establish a transition effect */
export function transitionEffectHelper(
  input: Partial<TransitionEffectClasses>
): TransitionEffectClasses {
  return { enter: '', enterFrom: '', enterTo: '', leave: '', leaveFrom: '', leaveTo: '', ...input }
}

export const transitionEffects: Record<TransitionEffectLabel, TransitionEffectClasses> = {
  'fade-in/fade-out': transitionEffectHelper({
    enter: 'transition-opacity text-text-light ease-linear duration-300',
    enterFrom: 'opacity-0',
    enterTo: 'opacity-100',
    leave: 'transition-opacity text-text-light ease-linear duration-300',
    leaveFrom: 'opacity-100',
    leaveTo: 'opacity-0'
  }),
  'from-left': transitionEffectHelper({
    enter: 'transition-opacity duration-[2000ms]',
    enterFrom: 'opacity-0',
    enterTo: 'opacity-100',
    leave: 'transition-opacity ease-linear duration-[2000ms]',
    leaveFrom: 'opacity-100',
    leaveTo: 'opacity-0'
  })
}

export const transitionEffectLabels = Object.keys(transitionEffects) as TransitionEffectLabel[]
