import { addDefault } from '@edsolater/fnkit'
import { DrawerProps } from '../Drawer'
import { createPlugin } from '../../../plugins'

export type DrawerVariables = {
  '--drawer-bg'?: string
  '--float-bg'?: string
  '--panel-radius'?: string
}

export type LetDrawerStyleOptions = {
  variables?: DrawerVariables
  // if content is scrollable, PLEASE open it!!!, for blur will make scroll super fuzzy
  maskNoBlur?: boolean
  canClosedByMask?: boolean
}

export const letDrawerStyle = createPlugin<DrawerProps>(
  ({ variables, maskNoBlur, canClosedByMask = true }) => ({
    icss: addDefault(variables ?? {}, {
      '--drawer-bg': '#fff',
      '--float-bg': '#afbaba',
      '--panel-radius': '16px'
    }),
    anatomy: {
      panel: ({ placement }) => ({
        icss: {
          padding: '4px 8px',
          borderRadius: {
            'from-left': '0 var(--panel-radius) var(--panel-radius) 0',
            'from-right': 'var(--panel-radius) 0 0 var(--panel-radius)',
            'from-top': '0 0 var(--panel-radius) var(--panel-radius)',
            'from-bottom': 'var(--panel-radius) var(--panel-radius) 0 0'
          }[placement],
          background: 'var(--drawer-bg)',
          boxShadow: '0px 8px 16px #787f86a3',
          width: {
            'from-left': 'min(400px, 90vw)',
            'from-right': 'min(400px, 90vw)'
          }[placement],
          height: {
            'from-top': 'min(200px, 50dvh)',
            'from-bottom': 'min(200px, 50dvh)'
          }[placement],
        }
      }),
      mask: ({ placement }) => ({
        icss: {
          background: '#0000001c',
          backdropFilter: maskNoBlur ? undefined : 'blur(6px)',
          pointerEvents: canClosedByMask ? undefined : 'none'
        }
      })
    }
  }),
  { priority: -1 }
)
