/**
 * @fileOverview 价格最高线/价格基线
 * @date 2025-04-24
 * @author poohlaha
 */
import React from 'react'
import { AxisTextOffset, HighestDefaultProps, ITimeHighestProps } from '../../types/time'
import Utils from '@pages/time-k-line/utils'

const Highest: React.FC<ITimeHighestProps> = (props: ITimeHighestProps) => {
  const render = () => {
    const lineColor = props.lineColor ?? HighestDefaultProps.lineColor
    const textColor = props.textColor ?? HighestDefaultProps.textColor
    const lineType = props.lineType ?? HighestDefaultProps.lineType
    const strokeDasharray = lineType === 'dashed' ? '4 2' : 'none'

    // 计算 y 坐标
    const price = props.price
    const y = props.y

    const textWidth = Utils.onMeasureTextWidth(`${price}`, props.fontSize, props.fontFamily)
    const textX = props.isAxisLeft ? textWidth + AxisTextOffset : props.width - AxisTextOffset
    return (
      <g>
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
          x={textX}
          y={y - AxisTextOffset / 2}
          fill={textColor}
          textAnchor="end"
          fontSize={props.fontSize}
          fontFamily={props.fontFamily}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {price.toFixed(2)}
        </text>
      </g>
    )
  }

  return render()
}

export default Highest
