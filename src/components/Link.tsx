import { icssClickable } from '../styles'
import { Text } from './Text'
import { renamedKit } from './utils'

export const Link = renamedKit('Link', Text, {
  icss: [
    {
      color: 'dodgerblue',
      ':hover': {
        textDecoration: 'underline'
      }
    },
    icssClickable
  ],
  as: 'a'
})
