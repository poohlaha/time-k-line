/**
 * @fileOverview 十字准线
 * @date 2025-04-24
 * @author poohlaha
 */
import React, { ReactElement } from 'react'
import { DefaultCrossProps, ITimeCrossProps } from '../../types/time'

const Cross: React.FC<ITimeCrossProps> = (props: ITimeCrossProps): ReactElement => {
  const render = () => {
    const show = props.show ?? true
    if (!show) return <div></div>

    const color = props.color ?? DefaultCrossProps.color
    const lineType = props.lineType ?? DefaultCrossProps.lineType
    const strokeDasharray = lineType === 'dashed' ? '4 2' : 'none'

    return (
      <svg width={props.width} height={props.height}>
        <line x1={props.x} y1={0} x2={props.x} y2={props.height} stroke={color} strokeDasharray={strokeDasharray} />
        <line x1={0} y1={props.y} x2={props.width} y2={props.y} stroke={color} strokeDasharray={strokeDasharray} />
      </svg>
    )
  }

  return render()
}

export default Cross
