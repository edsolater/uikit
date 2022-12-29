import { addDefault } from '@edsolater/fnkit'
import { DrawerProps } from '..'
import { createPlugin } from '../../../plugins'

export type DrawerVariables = {
  '--drawer-bg'?: string
  '--float-bg'?: string
  '--float-bg-2'?: string
  '--outer-radius'?: string
  '--inner-radius'?: string
}

export type LetDrawerStyleOptions = {
  variables?: DrawerVariables
}

export const letDrawerStyle = createPlugin<LetDrawerStyleOptions & DrawerProps<any>>(
  (props) => ({
    icss: addDefault(props?.variables ?? {}, {
      '--drawer-bg': '#eee',
      '--float-bg': '#afbaba',
      '--outer-radius': '8px',
      '--inner-radius': '4px'
    }),
    anatomy: {
      drawerTrigger: {
        icss: {
          padding: '8px 32px',
          borderRadius: 'var(--outer-radius)',
          background: 'var(--drawer-bg)'
        }
      },
      panel: {
        icss: {
          padding: '4px 8px',
          borderRadius: 'var(--outer-radius)',
          background: 'var(--drawer-bg)'
        }
      },
      drawerItemBox: {
        icss: {
          padding: '4px 8px',
          borderRadius: 'var(--inner-radius)'
        }
      },
      letAddFloatBgOptions: ({ activeDrawerIndex }) => ({
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
