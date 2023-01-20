import { addDefault } from '@edsolater/fnkit'
import { MenuProps } from '..'
import { createPlugin } from '../../../plugins'

export type MenuVariables = {
  '--menu-bg'?: string
  '--float-bg'?: string
  '--float-bg-2'?: string
  '--outer-radius'?: string
  '--inner-radius'?: string
}

export type LetMenuStyleOptions = {
  variables?: MenuVariables
}

export const letMenuStyle = createPlugin<LetMenuStyleOptions & MenuProps<unknown>>(
  (props) => ({
    icss: addDefault(props?.variables ?? {}, {
      '--menu-bg': '#eee',
      '--float-bg': '#afbaba',
      '--outer-radius': '8px',
      '--inner-radius': '4px'
    }),
    anatomy: {
      menuTrigger: {
        icss: {
          padding: '8px 32px',
          borderRadius: 'var(--outer-radius)',
          background: 'var(--menu-bg)'
        }
      },
      panel: {
        icss: {
          padding: '4px 8px',
          borderRadius: 'var(--outer-radius)',
          background: 'var(--menu-bg)'
        }
      },
      menuItemBox: {
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
