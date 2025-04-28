/**
 * @fileOverview 价格最高线/价格基线
 * @date 2025-04-24
 * @author poohlaha
 */
import React from 'react'
import { AxisTextOffset, HighestDefaultProps, ITimeHighestProps } from '../../types/time'

const Highest: React.FC<ITimeHighestProps> = (props: ITimeHighestProps) => {
  const render = () => {
    const lineColor = props.lineColor ?? HighestDefaultProps.lineColor
    const textColor = props.textColor ?? HighestDefaultProps.textColor
    const lineType = props.lineType ?? HighestDefaultProps.lineType
    const strokeDasharray = lineType === 'dashed' ? '4 2' : 'none'

    // 计算 y 坐标
    const maxPrice = props.maxPrice
    const y = props.padding + props.y

    return (
      <>
        {/* 水平线 */}
        <line
          x1={0}
          y1={y}
          x2={props.width}
          y2={y}
          stroke={lineColor}
          strokeDasharray={strokeDasharray}
          strokeWidth={1}
        />

        {/* 文字标签 */}
        <text
          x={props.width - AxisTextOffset}
          y={y - AxisTextOffset}
          fill={textColor}
          textAnchor="end"
          fontSize={props.fontSize}
        >
          {maxPrice.toFixed(2)}
        </text>
      </>
    )
  }

  return render()
}

export default Highest
