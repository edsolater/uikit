import { isArray, MayArray, shrinkToValue } from '@edsolater/fnkit/dist-old'
import { useRef } from 'react'
import { cssTransitionTimeFnOutCubic } from '../styles'
import { cssColors, opacityCSSColor } from '../styles/cssValues'
import { CSSColorString } from '../styles/type'
import { BooleanLike } from '../typings/constants'
import { MayFunction } from '../typings/tools'
import { Div, DivProps } from './Div'

export interface ButtonProps extends DivProps<'button'> {
  /**
   * @default 'solid'
   */
  variant?: 'solid' | 'outline' | 'text'
  /**
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * button's mean  color (apply to all variant of button)
   * default {@link cssColors.buttonPrimaryColor } when in darkMode
   */
  themeColor?: CSSColorString
  onClick?: () => void

  /** a short cut for validator */
  disabled?: boolean
  /** must all condition passed */
  validators?: MayArray<{
    /** must return true to pass this validator */
    should: MayFunction<BooleanLike>
    // used in "connect wallet" button, it's order is over props: disabled
    forceActive?: boolean
    /**  items are button's setting which will apply when corresponding validator has failed */
    fallbackProps?: Omit<ButtonProps, 'validators' | 'disabled'>
  }>
}

/**
 * feat: build-in click ui effect
 */
export default function Button({ validators, ...otherButtonProps }: ButtonProps) {
  const failedValidator = (isArray(validators) ? validators.length > 0 : validators)
    ? [validators!].flat().find(({ should }) => !shrinkToValue(should))
    : undefined
  const mergedProps = {
    ...otherButtonProps,
    ...failedValidator?.fallbackProps
  }
  const isActive = failedValidator?.forceActive || (!failedValidator && !mergedProps.disabled)
  const disable = !isActive

  const {
    variant = 'solid',
    size = 'md',
    themeColor = cssColors.buttonPrimaryColor,
    onClick: originalOnClick,
    ...restProps
  } = mergedProps

  // @ts-expect-error error for not match the count of originalOnClick, but don't need to care about it
  const onClick = (...args) => !disable && originalOnClick?.(...args)
  const ref = useRef<HTMLButtonElement>(null)

  return (
    <Div<'button'>
      {...restProps}
      as='button'
      onClick={onClick}
      className_='Button'
      htmlProps_={{ type: 'button' }}
      icss_={[
        { transition:'300ms' },// make it's change smooth
        { border: 'none' }, // initialize
        { color: variant === 'solid' ? 'white' : themeColor }, // light mode
        { display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center' }, // center the items
        {
          cursor: 'pointer',
          userSelect: 'none',
          width: 'max-content'
        },
        disable && {
          opacity: 0.3,
          cursor: 'not-allowed'
        },
        {
          padding: size === 'sm' ? '0 8px' : size === 'lg' ? '12px 24px' : '6px 16px',
          fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
          borderRadius: size === 'sm' ? 4 : size === 'lg' ? 8 : 6
        },
        variant === 'solid' && {
          backgroundColor: themeColor,
          transition: `transform 100ms ${cssTransitionTimeFnOutCubic}`,
          ':hover': {
            filter: 'brightness(95%)'
          },
          ':active': {
            transform: 'scale(0.96)',
            filter: 'brightness(90%)'
          }
        },
        variant === 'outline' && {
          background: cssColors.transparent,
          outline: `${size === 'lg' ? '2px' : size === 'sm' ? '1px' : '2px'} solid ${cssColors.buttonPrimaryColor}`,
          outlineOffset: `-${size === 'lg' ? '2px' : size === 'sm' ? '1px' : '2px'}`
        },
        variant === 'text' && {
          ':hover': {
            backgroundColor: opacityCSSColor(themeColor, 0.15)
          }
        }
      ]}
      domRef_={ref}
    >
      {otherButtonProps.children ?? 'BUTTON'}
    </Div>
  )
}
