type TransitionEffectClasses = {
  enter: string
  enterFrom: string
  enterTo: string
  leave: string
  leaveFrom: string
  leaveTo: string
}
function transitionEffectHelper(input: Partial<TransitionEffectClasses>): TransitionEffectClasses {
  return { enter: '', enterFrom: '', enterTo: '', leave: '', leaveFrom: '', leaveTo: '', ...input }
}

export const fadeInTransitionEffect = transitionEffectHelper({
  enter: 'transition-opacity ease-linear duration-300',
  enterFrom: 'opacity-0',
  enterTo: 'opacity-100',
  leave: 'transition-opacity ease-linear duration-300',
  leaveFrom: 'opacity-100',
  leaveTo: 'opacity-0'
})
