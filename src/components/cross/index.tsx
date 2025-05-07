/**
 * @fileOverview 十字准线
 * @date 2025-04-24
 * @author poohlaha
 */
import React, { ReactElement } from 'react'
import { DefaultCrossProps, ITimeCrossProps } from '../../types/component'
import Utils from '../../utils'
import { AxisDefaultProps } from '../../types/component'

const Cross: React.FC<ITimeCrossProps> = (props: ITimeCrossProps): ReactElement => {
  /**
   * 计算左边和右边显示文字
   */
  const getLeftRightLabel = () => {
    const price = props.isAxisLeft ? props.yLeftLabel || '' : props.yRightLabel || ''
    if (Utils.isBlank(price || '')) {
      return null
    }

    const p = parseFloat(Number(price).toFixed(2))
    const priceSize = Utils.onMeasureTextSize(`${p.toFixed(2)}`, props.fontSize, props.fontFamily)

    const { amplitude } = Utils.onCalculateRiseAndFall(p, props.closingPrice) // 计算涨跌幅
    const amplitudeSize = Utils.onMeasureTextSize(amplitude, props.fontSize, props.fontFamily)

    let leftLabel = ''
    let rightLabel = ''
    let leftTextWidth: number = 0
    let leftTextHeight: number = 0
    let rightTextWidth: number = 0
    let rightTextHeight: number = 0
    if (props.isAxisLeft) {
      leftLabel = price || ''
      rightLabel = amplitude || ''
      leftTextWidth = priceSize.width
      leftTextHeight = priceSize.height
      rightTextWidth = amplitudeSize.width
      rightTextHeight = amplitudeSize.height
    } else {
      leftLabel = amplitude || ''
      rightLabel = price || ''
      leftTextWidth = amplitudeSize.width
      leftTextHeight = amplitudeSize.height
      rightTextWidth = priceSize.width
      rightTextHeight = priceSize.height
    }

    return { leftLabel, rightLabel, leftTextWidth, rightTextWidth, leftTextHeight, rightTextHeight }
  }

  const getLabelNode = () => {
    const padding = 6
    const labelProps = getLeftRightLabel()
    if (labelProps === null) return null

    const leftRectHeight = labelProps.leftTextHeight + padding
    const rightRectHeight = labelProps.rightTextHeight + padding

    return (
      <>
        {!Utils.isBlank(labelProps.leftLabel || '') && (
          <>
            <rect
              x={AxisDefaultProps.lineWidthOrHeight}
              y={props.y - leftRectHeight / 2}
              width={labelProps.leftTextWidth + padding}
              height={leftRectHeight}
              fill={props.textBackgroundColor}
              rx={6}
              ry={6}
            />
            <text
              x={AxisDefaultProps.lineWidthOrHeight + padding / 2}
              y={props.y + leftRectHeight / 2 - padding}
              fill={props.textColor}
              textAnchor="start"
              fontSize={props.fontSize}
              fontFamily={props.fontFamily}
              style={{ userSelect: 'none', pointerEvents: 'none' }}
            >
              {labelProps.leftLabel || ''}
            </text>
          </>
        )}

        {!Utils.isBlank(labelProps.rightLabel || '') && (
          <>
            <rect
              x={props.width - (labelProps.rightTextWidth + AxisDefaultProps.lineWidthOrHeight + padding)}
              y={props.y - rightRectHeight / 2}
              width={labelProps.rightTextWidth + padding}
              height={rightRectHeight}
              fill={props.textBackgroundColor}
              rx={6}
              ry={6}
            />
            <text
              x={props.width - (labelProps.rightTextWidth + padding / 2 + AxisDefaultProps.lineWidthOrHeight)}
              y={props.y + rightRectHeight / 2 - padding}
              fill={props.textColor}
              textAnchor="start"
              fontSize={props.fontSize}
              fontFamily={props.fontFamily}
              style={{ userSelect: 'none', pointerEvents: 'none' }}
            >
              {labelProps.rightLabel || ''}
            </text>
          </>
        )}
      </>
    )
  }

  const render = () => {
    const show = props.show ?? true
    if (!show) return <div></div>

    const color = props.color ?? DefaultCrossProps.color
    const lineType = props.lineType ?? DefaultCrossProps.lineType
    const strokeDasharray = lineType === 'dashed' ? '4 2' : 'none'

    return (
      <svg width={props.width} height={props.height} className="time-k-cross">
        {/* 纵向 */}
        <line x1={props.x} y1={0} x2={props.x} y2={props.height} stroke={color} strokeDasharray={strokeDasharray} />

        {/* 横向 */}
        <line x1={0} y1={props.y} x2={props.width} y2={props.y} stroke={color} strokeDasharray={strokeDasharray} />

        {getLabelNode()}
      </svg>
    )
  }

  return render()
}

export default Cross
