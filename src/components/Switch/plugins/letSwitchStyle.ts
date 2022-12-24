import { addDefault } from '@edsolater/fnkit'
import { DivProps } from '../../../Div'
import { mergeProps } from '../../../Div/utils/mergeProps'
import { createPlugx } from '../../../plugins'
import { SwitchCoreProps } from '../index'

export type SwitchVariables = {
  '--thumb-outer-width'?: string
  '--track-width'?: string
  '--checked-thumb-color'?: string
  '--track-border-color'?: string
  '--unchecked-thumb-color'?: string
  '--checked-track-bg'?: string
  '--unchecked-track-bg'?: string
  '--track-border-width'?: string
}

export type LetSwitchStyleOptions = {
  variables?: SwitchVariables
}

export const letSwitchStyle = createPlugx<LetSwitchStyleOptions & SwitchCoreProps>((props) =>
  {
    console.log('props: ', props)
    return mergeProps(props, {
      icss: addDefault(props?.variables ?? {}, {
        '--thumb-outer-width': '24px',
        '--track-width': '48px',
        '--checked-thumb-color': 'white',
        '--track-border-color': '#74796e',
        '--unchecked-thumb-color': '#74796e',
        '--checked-track-bg': 'dodgerblue',
        '--unchecked-track-bg': 'transparent',
        '--track-border-width': '2px'
      }),
      anatomy: {
        track: {
          icss: {
            width: 'var(--track-width)',
            backgroundColor: props.checked ? 'var(--checked-track-bg)' : 'var(--unchecked-track-bg)',
            border: `var(--track-border-width) solid var(--track-border-color)`,
            borderRadius: '100vw',
            transition: '300ms'
          }
        },
        thumb: {
          icss: [
            {
              translate: props.checked ? `calc(100% - 2 * var(--track-border-width))` : undefined,
              scale: props.checked ? '.8' : '.6',
              width: 'var(--thumb-outer-width)',
              height: 'var(--thumb-outer-width)',
              backgroundColor: props.checked ? 'var(--checked-thumb-color)' : 'var(--unchecked-thumb-color)',
              borderRadius: '100vw'
            },
            { transition: '300ms' }
          ]
        }
      }
    } as SwitchCoreProps & DivProps)
  }
)