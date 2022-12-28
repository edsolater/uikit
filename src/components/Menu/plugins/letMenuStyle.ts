import { addDefault } from '@edsolater/fnkit'
import { MenuCoreProps } from '..'
import { createPlugin } from '../../../plugins'

export type MenuVariables = {
  '--container-bg'?: string
  '--float-bg'?: string
  '--float-bg-2'?: string
  '--outer-radius'?: string
  '--inner-radius'?: string
}

export type LetMenuStyleOptions = {
  variables?: MenuVariables
}

export const letMenuStyle = createPlugin<LetMenuStyleOptions & MenuCoreProps<any>>(
  (props) => ({
    icss: addDefault(props?.variables ?? {}, {
      '--container-bg': '#eaf0ef80',
      '--float-bg': '#afbaba',
      '--outer-radius': '8px',
      '--inner-radius': '4px'
    }),
    anatomy: {
      container: {
        icss: {
          padding: '4px 8px',
          borderRadius: 'var(--outer-radius)',
          background: 'var(--container-bg)'
        }
      },
      labelBox: {
        icss: {
          padding: '4px 8px',
          borderRadius: 'var(--inner-radius)'
        }
      },
      letAddFloatBgOptions: ({ activeMenuIndex }) => ({
        floatBgProps: {
          icss: {
            background: 'var(--float-bg)',
            borderRadius: 'var(--inner-radius)'
          }
        }
      })
    }
  }),
  { priority: -1 }
)
