import { MayArray, MayFn, shrinkToValue } from '@edsolater/fnkit'
import { useToggle } from '@edsolater/hookit'
import { HTMLInputTypeAttribute, ReactNode, RefObject, useState, useRef, useEffect, useImperativeHandle } from 'react'
import { DivProps, Div } from './Div'

export interface InputHandler {
  focus(): void
  clearInput(): void
}

export interface InputProps extends Omit<DivProps, 'onClick' | 'children'> {
  id?: string // for accessibility

  type?: HTMLInputTypeAttribute // current support type in this app

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
   * !!! try not to use it, use more intuitive `props:disabled`
   * it makes input refuse user to edit,
   *
   * different from disabled,
   * user will believe everything is ok (input's style is as good as normal),
   * but actually can't input
   * */
  disableUserInput?: boolean
  pattern?: RegExp // with force pattern, you only can input pattern allowed string
  /** must all condition passed (one by one) */
  validators?: MayArray<{
    /** expression must return true to pass this validator */
    should: MayFn<boolean, [text: string, payload: { el: HTMLInputElement; control: InputHandler }]>
    /**  items are button's setting which will apply when corresponding validator has failed */
    validProps?: Omit<InputProps, 'validators' | 'disabled'>
    invalidProps?: Omit<InputProps, 'validators' | 'disabled'>
    onValid?: (text: string, payload: { el: HTMLInputElement; control: InputHandler }) => void
    onInvalid?: (text: string, payload: { el: HTMLInputElement; control: InputHandler }) => void
  }>

  /**
   * remove `min-width:10em`
   * input will auto widen depends on content Text */
  isAtuoGrow?: boolean

  /** Optional. usually, it is an <Input>'s icon */
  prefix?: MayFn<ReactNode, [text: string | undefined]>
  /** Optional. usually, it is an <Input>'s unit or feature icon */
  suffix?: MayFn<ReactNode, [text: string | undefined]>

  componentRef?: RefObject<any>
  inputDomRef?: DivProps<'input'>['domRef']
  inputClassName?: DivProps<'input'>['className']
  /**
   * this callback may be invoked every time value change regardless it is change by user input or js code
   * as a controlled formkit, U should avoid using it if U can
   * it may be confusing with onUserInput sometimes
   */
  onDangerousValueChange?: (text: string | undefined, el: HTMLInputElement) => void
  onUserInput?: (text: string | undefined, el: HTMLInputElement) => void
  onClick?: (text: string | undefined, payload: { el: HTMLInputElement; control: InputHandler }) => void
  onEnter?: (text: string | undefined, payload: { el: HTMLInputElement; control: InputHandler }) => void
  onBlur?: (text: string | undefined, payload: { el: HTMLInputElement; control: InputHandler }) => void
}

export function Input(props: InputProps) {
  // props set by validators
  const [fallbackProps, setFallbackProps] = useState<Omit<InputProps, 'validators' | 'disabled'>>()

  const {
    id,

    type,

    ariaRequired,
    ariaLabelText,

    pattern,

    placeholder,

    disabled,
    validators,

    defaultValue,
    value,
    prefix,
    suffix,
    componentRef,
    inputDomRef,
    inputClassName,
    isAtuoGrow,
    onDangerousValueChange,
    onUserInput,
    onEnter,
    onBlur,
    onClick,
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

  const inputControls: InputHandler = {
    focus() {
      inputRef?.current?.focus()
    },
    clearInput() {
      setInnerValue('')
    }
  }

  useImperativeHandle(componentRef, () => inputControls)

  return (
    <Div
      {...restProps}
      className_='Input'
      onClick={() => {
        if (disabled || !inputRef.current) return
        inputRef.current.focus()
        onClick?.(innerValue, { el: inputRef.current, control: inputControls })
      }}
      icss_={[
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
        inputBodyProps={{
          isAtuoGrow,
          domRef: [inputRef, inputDomRef],
          className: inputClassName,
          htmlProps: {
            id,
            type,
            value: isOutsideValueLocked ? innerValue ?? value : value ?? innerValue,
            placeholder: placeholder ? String(placeholder) : undefined,
            disabled,
            onChange: (ev) => {
              const inputText = ev.target.value

              // refuse unallowed input
              if (pattern && !pattern.test(inputText)) return

              // update validator infos
              if (validators) {
                // all validators must be true
                for (const validator of [validators].flat()) {
                  const passed = Boolean(
                    shrinkToValue(validator.should, [inputText, { el: inputRef.current!, control: inputControls }])
                  )
                  if (passed) {
                    setFallbackProps(validator.validProps ?? {})
                    validator.onValid?.(inputText, { el: inputRef.current!, control: inputControls })
                  }
                  if (!passed) {
                    setFallbackProps(validator.invalidProps ?? {})
                    validator.onInvalid?.(inputText, { el: inputRef.current!, control: inputControls })
                  }
                }
              }

              setInnerValue(inputText)
              onUserInput?.(ev.target.value, inputRef.current!)
              lockOutsideValue()
            },
            onBlur: () => {
              unlockOutsideValue()
              onBlur?.(innerValue, { el: inputRef.current!, control: inputControls })
            },
            onKeyDown: (ev) => {
              if (ev.key === 'Enter') {
                onEnter?.((ev.target as HTMLInputElement).value, { el: inputRef.current!, control: inputControls })
              }
            },
            'aria-label': ariaLabelText,
            'aria-required': ariaRequired
          }
        }}
      />
      {suffix && <Div className='flex-initial ml-2'>{shrinkToValue(suffix, [innerValue])}</Div>}
    </Div>
  )
}

function AutoWidenInput({
  inputBodyProps
}: {
  inputBodyProps: DivProps<'input'> & Pick<InputProps, 'isAtuoGrow' | 'value'>
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

  return (
    <Div<'input'>
      as='input'
      {...inputBodyProps}
      domRef_={inputElement}
      htmlProps_={{
        autoComplete: 'off',
        onChange: recalcWrapperSize
      }}
      icss_={[
        { flex: 1, background: 'transparent', minWidth: inputBodyProps.isAtuoGrow ? undefined : '14em' },
        /* initialize */
        { border: 'none', padding: cssInputPadding }
      ]}
      style_={{
        width: `${minWith}px`
      }}
    />
  )
}
