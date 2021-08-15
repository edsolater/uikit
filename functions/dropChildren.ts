import { omit } from '@edsolater/fnkit/src/object'

export default function dropChildren(props: Record<string, any>) {
  return omit(props, 'children')
}
