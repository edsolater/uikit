import { isInt, MayArray, MayFn, mergeFunction, shrinkToValue } from '@edsolater/fnkit'
import { useEvent, useToggle } from '@edsolater/hookit'
import {
  HTMLInputTypeAttribute,
  ReactNode,
  RefObject,
  startTransition,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import { Div } from '../Div/Div'
import { DivProps } from '../Div/type'
import { onEvent } from '../utils'
import { splice } from '../utils/fnkit/splice.temp'
import { SubComponent } from './SubComponent'
import { createKit, KitProp } from './utils'

export interface InputStatus {
  text: string | undefined
}

export interface InputMethods {
  focus(): void
  clearInput(): void
}

export type InputControls = InputStatus & InputMethods

export type InputProps = KitProp<
  {
    id?: string // for accessibility

    type?: HTMLInputTypeAttribute // current support type in this app
    inputMode?: 'none' | 'text' /* default */ | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
    ariaRequired?: boolean // for readability
    /** only for aria */
    ariaLabelText?: string

    /** only after `<Input>` created */
    defaultValue?: string
    /** when change, affact to ui*/
    value?: string
    placeholder?: string

    disabled?: boolean
    /**
     * !!! try not to use this **wired** prop, use more intuitive `props:disabled`
     * it makes input refuse user to edit,
     *
     * different from disabled,
     * user will believe everything is ok (input's style is as good as normal),
     * but actually can't input
     * */
    disableUserInput?: boolean
    pattern?: RegExp // with force pattern, you only can input pattern allowed string
    /** must all condition passed (one by one)
     * !!! validator may be very complicated, and invalid input will not block user's input action.
     */
    validators?: MayArray<{
      /** expression must return true to pass this validator */
      should: MayFn<boolean, [text: string, payload: { el: HTMLInputElement; control: InputControls }]>
      /** by default, any input should be accepted */
      ignoreThisInput?: boolean
      /**  items are button's setting which will apply when corresponding validator has failed */
      validProps?: Omit<InputProps, 'validators' | 'disabled'>
      invalidProps?: Omit<InputProps, 'validators' | 'disabled'>
      onValid?: (text: string, payload: { el: HTMLInputElement; control: InputControls }) => void
      onInvalid?: (text: string, payload: { el: HTMLInputElement; control: InputControls }) => void
    }>

    /**
     * remove `min-width:10em`
     * input will auto widen depends on content Text */
    isFluid?: boolean

    /** Optional. usually, it is an <Input>'s icon */
    prefix?: MayFn<ReactNode, [text: string | undefined]>
    /** Optional. usually, it is an <Input>'s unit or feature icon */
    suffix?: MayFn<ReactNode, [text: string | undefined]>

    controller?: RefObject<any>
    inputDomRef?: DivProps<'input'>['domRef']
    inputClassName?: DivProps<'input'>['className']
    inputHTMLProps?: DivProps<'input'>['htmlProps']
    /**
     * this callback may be invoked every time value change regardless it is change by user input or js code
     * as a controlled formkit, U should avoid using it if U can
     * it may be confusing with onUserInput sometimes
     */
    onDangerousValueChange?: (text: string | undefined, el: HTMLInputElement) => void // TODO: should be onInput (by(property):'any')
    onUserInput?: (text: string | undefined, el: HTMLInputElement) => void // TODO: should be onInput (by(property):'user')
    onClick?: ((utils: { text?: string; control: InputControls }) => void) & DivProps<'input'>['onClick']
    onEnter?: (text: string | undefined, payload: { el: HTMLInputElement; control: InputControls }) => void
    onBlur?: (text: string | undefined, payload: { el: HTMLInputElement; control: InputControls }) => void
    onFocus?: (text: string | undefined, payload: { el: HTMLInputElement; control: InputControls }) => void
  },
  'input',
  InputStatus
>

type CheckInputUtils = {
  key: string
  selectionStart?: number
  selectionEnd?: number
}

export const Input = createKit('Input', (props: InputProps) => {
  // props set by validators
  const [fallbackProps, setFallbackProps] = useState<Omit<InputProps, 'validators' | 'disabled'>>()

  const {
    id,

    type,
    inputMode,
    ariaRequired,
    ariaLabelText,

    value,
    defaultValue,
    placeholder,

    disabled,
    pattern,
    validators,

    prefix,
    suffix,
    controller,
    inputDomRef,
    inputClassName,
    inputHTMLProps,
    isFluid,
    onDangerousValueChange,
    onUserInput,
    onEnter,
    onBlur,
    onClick,
    onFocus,
    ...restProps
  } = { ...props, ...fallbackProps }

  const inputRef = useRef<HTMLInputElement>()

  // only useable for uncontrolled formkit
  const [innerValue, setInnerValue] = useState(defaultValue ?? value)
  useEffect(() => {
    setInnerValue(value)
  }, [value])

  useEffect(() => {
    if (!inputRef.current) return
    onDangerousValueChange?.(innerValue, inputRef.current)
  }, [innerValue])

  // if user is inputing or just input, no need to update upon out-side value
  const [isOutsideValueLocked, { on: lockOutsideValue, off: unlockOutsideValue }] = useToggle()

  const inputStatus: InputStatus = {
    text: innerValue
  }
  const inputMethods: InputMethods = {
    focus() {
      inputRef?.current?.focus()
    },
    clearInput() {
      setInnerValue('')
    }
  }
  const inputControls: InputControls = { ...inputStatus, ...inputMethods }

  useImperativeHandle(controller, () => inputControls)

  // this relay on keyboard down, not prefect with copyboard paste
  const predictNextSentence = useEvent((utils: CheckInputUtils): string => {
    const isOneWord = /^.{1}$/.test(utils.key)
    const prev = innerValue ?? ''
    if (!isOneWord) return prev // if not one word , it is control key
    const selectionStart = utils.selectionStart
    const selectionEnd = utils.selectionEnd
    const next =
      isInt(selectionStart) && selectionEnd && selectionStart
        ? splice([...prev], selectionStart, (selectionEnd ?? selectionStart) - selectionStart, utils.key).join('')
        : prev
    return next
  })

  return (
    <Div
      shadowProps={restProps}
      className='Input'
      onClick={(utils) => {
        if (disabled || !inputRef.current) return
        inputRef.current.focus()
        onClick?.({ text: innerValue, control: inputControls, ...utils })
      }}
      icss={[
        { display: 'flex' },
        /* initialize */
        {
          transition: '150ms',
          borderRadius: 4,
          outline: '2px solid rgba(204, 204, 204, 0.3)',
          ':focus-within': {
            outline: '2px solid rgba(204, 204, 204, 0.6)'
          },
          outlineOffset: -2
        }
      ]}
    >
      {prefix && <Div className='flex-initial'>{shrinkToValue(prefix, [innerValue])}</Div>}

      {/* input-wrapperbox is for style input inner body easier */}
      <AutoWidenInput
        isFluid={isFluid}
        domRef={[inputRef, inputDomRef]}
        className={inputClassName}
        checkUserTypeIsValid={(utils: CheckInputUtils) => (pattern ? pattern.test(predictNextSentence(utils)) : true)}
        onChange={(text) => {
          // update validator infos
          if (validators) {
            // all validators must be true
            for (const validator of [validators].flat()) {
              const passed = Boolean(
                shrinkToValue(validator.should, [text, { el: inputRef.current!, control: inputControls }])
              )
              if (passed) {
                setFallbackProps(validator.validProps ?? {})
                validator.onValid?.(text, { el: inputRef.current!, control: inputControls })
              }
              if (!passed) {
                setFallbackProps(validator.invalidProps ?? {})
                validator.onInvalid?.(text, { el: inputRef.current!, control: inputControls })
              }
            }
          }
          setInnerValue(text)
          lockOutsideValue()
          startTransition(() => {
            onUserInput?.(text, inputRef.current!)
          })
        }}
        htmlProps={[
          inputHTMLProps,
          {
            id,
            type,
            inputMode,
            value: isOutsideValueLocked ? innerValue ?? value ?? '' : value ?? innerValue ?? '',
            placeholder: placeholder ? String(placeholder) : undefined,
            disabled,

            onBlur: () => {
              unlockOutsideValue()
              onBlur?.(innerValue, { el: inputRef.current!, control: inputControls })
            },
            onFocus: () => {
              lockOutsideValue()
              onFocus?.(innerValue, { el: inputRef.current!, control: inputControls })
            },
            onKeyDown: (ev) => {
              if (ev.key === 'Enter') {
                onEnter?.((ev.target as HTMLInputElement).value, { el: inputRef.current!, control: inputControls })
              }
            },
            'aria-label': ariaLabelText,
            'aria-required': ariaRequired
          }
        ]}
      />
      {suffix && <Div className='flex-initial ml-2'>{shrinkToValue(suffix, [innerValue])}</Div>}
    </Div>
  )
})

function AutoWidenInput({
  checkUserTypeIsValid,
  onChange,
  ...inputBodyProps
}: DivProps<'input'> &
  Pick<InputProps, 'isFluid' | 'value'> & {
    onChange(t: string): void
    checkUserTypeIsValid?: (utils: { key: string; selectionStart?: number; selectionEnd?: number }) => boolean
  }) {
  // css flexible
  const cssInputPadding = 8 // (px)
  const minWith = 2 * cssInputPadding + 16

  const inputElement = useRef<HTMLInputElement>()

  const recalcWrapperSize = () => {
    const inputBody = inputElement.current
    if (!inputBody) return
    inputBody.style.width = '0px' // to get true scrollWidth without space
    inputBody.style.width = `${Math.max(inputBody.scrollWidth, minWith)}px`
  }

  useEffect(() => {
    onEvent(
      inputElement.current,
      'keydown',
      ({ el, ev }) => {
        const key = ev.key
        const isValid =
          checkUserTypeIsValid?.({
            key: key,
            selectionStart: el?.selectionStart ?? undefined,
            selectionEnd: el?.selectionEnd ?? undefined
          }) ?? true
        const isControlKey = ev.ctrlKey || ev.altKey
        if (!isValid && !isControlKey) {
          ev.preventDefault()
        }
      },
      { passive: false } // so can prevent change value in DOM
    )
  }, [])

  return (
    <Div<'input'>
      as='input'
      shadowProps={inputBodyProps}
      domRef={inputElement}
      htmlProps={{
        autoComplete: 'off',
        onChange: mergeFunction(recalcWrapperSize, (ev) => {
          onChange(ev.target?.value || '')
        })
      }}
      icss={[
        { flex: 1, background: 'transparent', minWidth: inputBodyProps.isFluid ? undefined : '14em' },
        /* initialize */
        { border: 'none', padding: cssInputPadding }
      ]}
      style={{
        width: `${minWith}px`
      }}
    />
  )
}

// TODO: useInputCheckerRef
export function FormFieldBaseItem({ children, ...divProps }: { children?: ReactNode } & DivProps) {
  return <SubComponent {...divProps}>{children}</SubComponent>
}
