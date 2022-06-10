import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

const NoSsr = (props: { children?: ReactNode }) => <>{props.children}</>

export default dynamic(() => Promise.resolve(NoSsr), {
  ssr: false
}) as () => JSX.Element
