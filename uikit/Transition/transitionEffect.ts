export type TransitionEffectClasses = {
  enter: string
  enterFrom: string
  enterTo: string
  leave: string
  leaveFrom: string
  leaveTo: string
}

export type TransitionEffectLabel =
  | 'fade-in/fade-out'
  | 'zoom-from-top'
  | 'zoom-from-right'
  | 'zoom-from-bottom'
  | 'zoom-from-left'
  | 'boom'

/** helper for establish a transition effect */
export function transitionEffectHelper(
  input: Partial<TransitionEffectClasses> & {
    /** shortcut: enter + leave */
    duringTransition?: string
    /** shortcut: enterFrom + leaveTo */
    stateOutClassName?: string
    /** shortcut: enterTo + leaveFrom */
    stateInClassName?: string
  }
): TransitionEffectClasses {
  return {
    enter: input.enter ?? input.duringTransition ?? '',
    enterFrom: input.enterFrom ?? input.stateOutClassName ?? '',
    enterTo: input.enterTo ?? input.stateInClassName ?? '',
    leave: input.leave ?? input.duringTransition ?? '',
    leaveFrom: input.leaveFrom ?? input.stateInClassName ?? '',
    leaveTo: input.leaveTo ?? input.stateOutClassName ?? ''
  }
}

export const transitionEffects: Record<TransitionEffectLabel, TransitionEffectClasses> = {
  'fade-in/fade-out': transitionEffectHelper({
    duringTransition: 'transition-all duration-300',
    stateOutClassName: 'opacity-0',
    stateInClassName: 'opacity-100'
  }),
  'zoom-from-top': transitionEffectHelper({
    duringTransition: 'transition-all duration-300',
    stateOutClassName: 'transition -translate-y-full',
    stateInClassName: 'transition translate-y-0'
  }),
  'zoom-from-right': transitionEffectHelper({
    duringTransition: 'transition-all duration-300',
    stateOutClassName: 'transition translate-x-full',
    stateInClassName: 'transition translate-x-0'
  }),
  'zoom-from-bottom': transitionEffectHelper({
    duringTransition: 'transition-all duration-300',
    stateOutClassName: 'transition translate-y-full',
    stateInClassName: 'transition translate-y-0'
  }),
  'zoom-from-left': transitionEffectHelper({
    duringTransition: 'transition-all duration-300',
    stateOutClassName: 'transition -translate-x-full',
    stateInClassName: 'transition translate-x-0'
  }),
  'boom': transitionEffectHelper({
    duringTransition: 'transition-all duration-300',
    stateOutClassName: 'transition scale-0',
    stateInClassName: 'transition scale-100'
  })
}

export const transitionEffectLabels = Object.keys(transitionEffects) as TransitionEffectLabel[]
