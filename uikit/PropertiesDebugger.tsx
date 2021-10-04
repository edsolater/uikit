import Div from './Div'

/** usually it is used for easier debug,  */
/** but maybe use <Div insertNodeTop={<PropertiesDebugger>{{a:1}}</PropertiesDebugger>} /> is better */
export default function PropertiesDebugger({
  targeObj,
  className
}: {
  targeObj: Record<any, any>
  className?: string
}) {
  return <Div className={className}>{Object.entries(targeObj).map(([key, value]) => `${key}: ${value};`)}</Div>
}
