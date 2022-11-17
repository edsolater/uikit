import { addDefault, isArray, MayArray, MayFn, shrinkToValue } from '@edsolater/fnkit'
import React from 'react'
import { ReactNode, RefObject, useImperativeHandle, useRef } from 'react'
import { mergeProps } from '../functions/react'
import { useUikitTheme } from '../hooks/useUikitTheme'
import { cssTransitionTimeFnOutCubic, ICSS } from '../styles'
import { cssColors, opacityCSSColor } from '../styles/cssValues'
import { CSSColorString, CSSStyle } from '../styles/type'
import { MayFunction } from '../typings/tools'
import { Div } from './Div/Div'
import { DivProps } from './Div/type'

type BooleanLike = unknown

export interface ButtonHandle {
  click?: () => void
  focus?: () => void
}

export interface ButtonProps extends DivProps<'button'> {
  /**
   * @default 'solid'
   */
  variant?: 'solid' | 'outline' | 'text'
  /**
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg'

  /**
   * !only for app's uikit <Button>
   * button's mean  color (apply to all variant of button)
   * default {@link cssColors.buttonPrimaryColor } when in darkMode
   */
  theme?: {
    mainColor?: MayFn<CSSColorString, [props: Readonly<Omit<ButtonProps, 'theme'>>]>
    mainTextColor?: MayFn<CSSColorString, [props: Readonly<Omit<ButtonProps, 'theme'>>]>
    contentGap?: MayFn<CSSStyle['gap'], [props: Readonly<Omit<ButtonProps, 'theme'>>]>
    disableOpacity?: MayFn<CSSStyle['opacity'], [props: Readonly<Omit<ButtonProps, 'theme'>>]>
    cssProps?: MayFn<ICSS, [props: Readonly<Omit<ButtonProps, 'theme'>>]>
  }

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
  /** normally, it's an icon  */
  prefix?: ReactNode
  /** normally, it's an icon  */
  suffix?: ReactNode
  componentRef?: RefObject<any>
}

/**
 * feat: build-in click ui effect
 */
export function Button(props: ButtonProps) {
  /* ---------------------------------- props --------------------------------- */
  const themeProps = useUikitTheme('Button')
  const { validators, ...otherButtonProps } = mergeProps(themeProps, props)

  /* ------------------------------- validation ------------------------------- */
  const failedValidator = (isArray(validators) ? validators.length > 0 : validators)
    ? [validators!].flat().find(({ should }) => !shrinkToValue(should))
    : undefined
  const mergedProps = {
    ...otherButtonProps,
    ...failedValidator?.fallbackProps
  }
  const isActive = failedValidator?.forceActive || (!failedValidator && !mergedProps.disabled)
  const disable = !isActive

  /* ------------------------------ detail props ------------------------------ */
  const {
    variant = 'solid',
    size = 'md',
    theme,
    prefix,
    suffix,
    componentRef,
    children,
    onClick: originalOnClick,
    ...restProps
  } = mergedProps

  const {
    mainColor = cssColors.buttonPrimaryColor,
    mainTextColor = variant === 'solid' ? 'white' : shrinkToValue(mainColor, [mergedProps]),
    contentGap = 4,
    disableOpacity = 0.3,
    cssProps
  } = theme ?? {}
  // @ts-expect-error error for not match the count of originalOnClick, but don't need to care about it
  const onClick = (...args) => !disable && originalOnClick?.(...args)
  const ref = useRef<HTMLButtonElement>(null)

  useImperativeHandle<any, ButtonHandle>(componentRef, () => ({
    click: () => {
      ref.current?.click()
    },
    focus: () => {
      ref.current?.focus()
    }
  }))

  const cssPadding = {
    lg: '14px 24px',
    md: '10px 16px',
    sm: '8px 16px',
    xs: '2px 6px'
  }[size]
  const cssFontSize = {
    lg: 16,
    md: 16,
    sm: 14,
    xs: 12
  }[size]
  const cssBorderRadius = {
    lg: 12,
    md: 8,
    sm: 8,
    xs: 4
  }[size]
  const cssOutlineWidth = {
    lg: 2,
    md: 2,
    sm: 1,
    xs: 0.5
  }[size]
  return (
    <Div<'button'>
      shadowProps={restProps}
      as='button'
      onClick={onClick}
      className={Button.name}
      htmlProps={{ type: 'button' }}
      icss={[
        { transition: `200ms ${cssTransitionTimeFnOutCubic}` }, // make it's change smooth
        { border: 'none' }, // initialize
        { color: shrinkToValue(mainTextColor, [mergedProps]) }, // light mode
        {
          display: 'inline-flex',
          gap: shrinkToValue(contentGap, [mergedProps]),
          alignItems: 'center',
          justifyContent: 'center'
        }, // center the items
        {
          cursor: 'pointer',
          userSelect: 'none',
          width: 'max-content'
        },
        disable && {
          opacity: shrinkToValue(disableOpacity, [mergedProps]),
          cursor: 'not-allowed'
        },
        {
          padding: cssPadding,
          fontSize: cssFontSize,
          borderRadius: cssBorderRadius,
          fontWeight: 500
        },
        variant === 'solid' && {
          backgroundColor: shrinkToValue(mainColor, [mergedProps]),
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
          outline: `${cssOutlineWidth} solid ${mainColor}`,
          outlineOffset: `-${cssOutlineWidth}`
        },
        variant === 'text' && {
          ':hover': {
            backgroundColor: opacityCSSColor(shrinkToValue(mainColor, [mergedProps]), 0.15)
          }
        },
        shrinkToValue(cssProps, [mergedProps])
      ]}
      domRef={ref}
    >
      {prefix}
      {children}
      {suffix}
    </Div>
  )
}
