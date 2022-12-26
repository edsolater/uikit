import { mergeProps } from '../../Div/utils/mergeProps'
import { composifyICSS } from '../../styles'
import { TransitionProps } from './Transition'

/** Transition Preset */
export const opacityInOut = ({ min = 0 }: { min?: number } = {}) =>
  ({
    enterFromProps: { icss: { opacity: min } },
    enterToProps: { icss: { opacity: 1 } },
    leaveFromProps: { icss: { opacity: 1 } },
    leaveToProps: { icss: { opacity: min } }
  } as TransitionProps)

/** Transition Preset */
export const trasformInOutFromRight: TransitionProps = {
  enterFromProps: { icss: { transform: 'translateX(100%)' } },
  enterToProps: { icss: { transform: 'translateX(0)' } },
  leaveFromProps: { icss: { transform: 'translateX(0)' } },
  leaveToProps: { icss: { transform: 'translateX(100%)' } }
}

/** Transition Preset */
export const trasformInOutFromLeft: TransitionProps = {
  enterFromProps: { icss: { transform: 'translateX(-100%)' } },
  enterToProps: { icss: { transform: 'translateX(0)' } },
  leaveFromProps: { icss: { transform: 'translateX(0)' } },
  leaveToProps: { icss: { transform: 'translateX(-100%)' } }
}

/** Transition Preset */
export const trasformInOutFromTop: TransitionProps = {
  enterFromProps: { icss: { transform: 'translateY(-100%)' } },
  enterToProps: { icss: { transform: 'translateY(0)' } },
  leaveFromProps: { icss: { transform: 'translateY(0)' } },
  leaveToProps: { icss: { transform: 'translateY(-100%)' } }
}

/** Transition Preset */
export const trasformInOutFromBottom: TransitionProps = {
  enterFromProps: { icss: { transform: 'translateY(100%)' } },
  enterToProps: { icss: { transform: 'translateY(0)' } },
  leaveFromProps: { icss: { transform: 'translateY(0)' } },
  leaveToProps: { icss: { transform: 'translateY(100%)' } }
}

/** Transition Preset */
export const scaleInOut: TransitionProps = {
  enterFromProps: { icss: { transform: 'scale(0)' } },
  enterToProps: { icss: { transform: 'scale(1)' } },
  leaveFromProps: { icss: { transform: 'scale(1)' } },
  leaveToProps: { icss: { transform: 'scale(0)' } }
}

export const transitionPresetFadeInOut: TransitionProps = mergeProps(
  toComposifyProps(opacityInOut()),
  toComposifyProps(trasformInOutFromLeft),
  toComposifyProps(scaleInOut)
)

function toComposifyProps(prop: TransitionProps): TransitionProps {
  const newProps = { ...prop, icss: prop.icss ? composifyICSS(prop.icss) : undefined }
  return newProps
}
