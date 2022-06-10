import { shrinkToValue } from '@edsolater/fnkit'
import React, {
  HTMLInputTypeAttribute,
  ReactNode,
  RefObject,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'

import { useToggle } from '../hooks'
import { MayArray, MayFunction } from '../typings/tools'
import Div, { DivProps } from './Div'

export interface InputHandler {
  focus(): void
  clearInput(): void
}

export interface InputProps extends Omit<DivProps, 'onClick' | 'children'> {
  id?: string // for accessibility

  type?: HTMLInputTypeAttribute // current support type in this app

  /** this will cause auto-grow <input> */
  required?: boolean // for readability

  /** only for aria */
  ariaLabelText?: string

  pattern?: RegExp // with force pattern, you only can input pattern allowed string

  /** only first render */
  defaultValue?: string

  /** when change, affact to ui*/
  value?: string

  placeholder?: string

  disabled?: boolean

  /** must all condition passed (one by one) */
  validators?: MayArray<{
    /** expression must return true to pass this validator */
    should: MayFunction<boolean, [text: string, payload: { el: HTMLInputElement; control: InputHandler }]>
    /**  items are button's setting which will apply when corresponding validator has failed */
    validProps?: Omit<InputProps, 'validators' | 'disabled'>
    invalidProps?: Omit<InputProps, 'validators' | 'disabled'>
    onValid?: (text: string, payload: { el: HTMLInputElement; control: InputHandler }) => void
    onInvalid?: (text: string, payload: { el: HTMLInputElement; control: InputHandler }) => void
  }>

  /** remove min-width:10em on inputCore so it will widen depends on text grow */
  isFluid?: boolean
  /** Optional. usually, it is an <Input>'s icon */
  prefix?: ReactNode

  /** Optional. usually, it is an <Input>'s unit or feature icon */
  suffix?: ReactNode

  componentRef?: RefObject<any>
  inputDomRef?: DivProps<'input'>['domRef']

  inputClassName?: string
  /**
   * this callback may be invoked every time value change regardless it is change by user input or js code
   * as a controlled formkit, U should avoid using it if U can
   * it may be confusing with onUserInput sometimes
   */
  onDangerousValueChange?: (currentValue: string, el: HTMLInputElement) => void
  onUserInput?: (text: string, el: HTMLInputElement) => void
  onClick?: (text: string, payload: { el: HTMLInputElement; control: InputHandler }) => void
  onEnter?: (text: string, payload: { el: HTMLInputElement; control: InputHandler }) => void
  onBlur?: (text: string, payload: { el: HTMLInputElement; control: InputHandler }) => void
}

/**
 *  both controlled and uncontrolled
 *
 *  default **uncontrolled** Kit
 *  - when set `defaultValue` --- **uncontrolled** Kit
 *  - when set `value` --- **controlled** Kit
 */
// TODO: use `contenteditable` to simulate inner `<input>` to make it flexible
export default function Input(props: InputProps) {
  // props set by validators
  const [fallbackProps, setFallbackProps] = useState<Omit<InputProps, 'validators' | 'disabled'>>()

  const {
    id,

    type,

    required,
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
    isFluid,
    onDangerousValueChange,
    onUserInput,
    onEnter,
    onBlur,
    onClick,
    ...restProps
  } = { ...props, ...fallbackProps }

  const inputRef = useRef<HTMLInputElement>()

  // only useable for uncontrolled formkit
  const [selfValue, setSelfValue] = useState(defaultValue ?? value ?? '')
  useEffect(() => {
    setSelfValue(value ?? '')
  }, [value])

  useEffect(() => {
    if (!inputRef.current) return
    onDangerousValueChange?.(String(value ?? ''), inputRef.current)
  }, [value])

  // if user is inputing or just input, no need to update upon out-side value
  const [isOutsideValueLocked, { on: lockOutsideValue, off: unlockOutsideValue }] = useToggle()

  const inputControls: InputHandler = {
    focus() {
      inputRef?.current?.focus()
    },
    clearInput() {
      setSelfValue('')
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
        onClick?.(selfValue, { el: inputRef.current, control: inputControls })
      }}
      icss_={[
        { display: 'flex' },
        /* initialize */
        {
          transition: '150ms',
          borderRadius: 4,
          outline: '2px solid rgba(204, 204, 204, 0.3)',
          ':focus-within': {
            outline: '2px solid rgba(204, 204, 204, 0.6)',
          },
          outlineOffset: -2
        }
      ]}
    >
      {prefix && <Div className='flex-initial'>{prefix}</Div>}

      {/* input-wrapperbox is for style input inner body easier */}
      <AutoWidenInput
        inputBodyProps={{
          isFluid,
          domRef: [inputRef, inputDomRef],
          className: inputClassName,
          htmlProps: {
            id,
            type,
            value: isOutsideValueLocked ? selfValue ?? value : value ?? selfValue,
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

              setSelfValue(inputText)
              onUserInput?.(ev.target.value, inputRef.current!)
              lockOutsideValue()
            },
            onBlur: () => {
              unlockOutsideValue()
              onBlur?.(selfValue, { el: inputRef.current!, control: inputControls })
            },
            onKeyDown: (ev) => {
              if (ev.key === 'Enter') {
                onEnter?.((ev.target as HTMLInputElement).value, { el: inputRef.current!, control: inputControls })
              }
            },
            'aria-label': ariaLabelText,
            'aria-required': required
          }
        }}
      />
      {suffix && <Div className='flex-initial ml-2'>{suffix}</Div>}
    </Div>
  )
}

function AutoWidenInput({ inputBodyProps }: { inputBodyProps: DivProps<'input'> & Pick<InputProps, 'isFluid'> }) {
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
      className={`bg-transparent border-none w-full outline-none block`} // start html input with only 2rem, if need width please define it in parent Div
      htmlProps_={{
        autoComplete: 'off',
        onChange: (ev) => {
          recalcWrapperSize()
        }
      }}
      icss_={[
        { flex: 1, background: 'transparent', minWidth: inputBodyProps.isFluid ? undefined : '14em' },

        /* initialize */
        { border: 'none', padding: cssInputPadding }
      ]}
      style_={{
        width: `${minWith}px`
      }}
    />
  )
}
