/**
 * @fileOverview 十字准线
 * @date 2025-04-24
 * @author poohlaha
 */
import React, { ReactElement } from 'react'
import { AxisTextOffset, DefaultCrossProps, ITimeCrossProps } from "../../types/time";
import Utils from '../../utils'

const Cross: React.FC<ITimeCrossProps> = (props: ITimeCrossProps): ReactElement => {
  const render = () => {
    const show = props.show ?? true
    if (!show) return <div></div>

    const color = props.color ?? DefaultCrossProps.color
    const lineType = props.lineType ?? DefaultCrossProps.lineType
    const strokeDasharray = lineType === 'dashed' ? '4 2' : 'none'
    const yLeftLabelProps = Utils.onMeasureTextSize(props.yLeftLabel, props.fontSize, props.fontFamily)
    const textLeftY = Number((props.y + (yLeftLabelProps.height / 2)).toFixed(2))

    const yRightLabelProps = Utils.onMeasureTextSize(props.yRightLabel, props.fontSize, props.fontFamily)
    const textRightY = Number((props.y + (yRightLabelProps.height / 2)).toFixed(2))

    const padding = 10
    return (
      <svg width={props.width} height={props.height}>
        {/* 纵向 */}
        <line x1={props.x} y1={0} x2={props.x} y2={props.height} stroke={color} strokeDasharray={strokeDasharray} />

        {/* 横向 */}
        <line x1={0} y1={props.y} x2={props.width} y2={props.y} stroke={color} strokeDasharray={strokeDasharray} />
        {
          !Utils.isBlank(props.yLeftLabel) && (
            <>
              <rect
                x={0}
                y={props.y - padding}
                width={yLeftLabelProps.width + padding}
                height={yLeftLabelProps.height + padding / 2}
                fill={props.textBackgroundColor}
                rx={6}
                ry={6}
              />
              <text
                x={padding / 2}
                y={textLeftY - padding / 4}
                fill={props.textColor}
                textAnchor="start"
                fontSize={props.fontSize}
                fontFamily={props.fontFamily}
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {props.yLeftLabel || ''}
              </text>
            </>
          )
        }

        {
          !Utils.isBlank(props.yRightLabel) && (
            <>
              <rect
                x={props.width - (yRightLabelProps.width + padding + AxisTextOffset)}
                y={props.y - padding}
                width={yRightLabelProps.width + padding}
                height={yRightLabelProps.height + padding / 2}
                fill={props.textBackgroundColor}
                rx={6}
                ry={6}
              />
              <text
                x={props.width - (yRightLabelProps.width + padding / 2 + AxisTextOffset)}
                y={textRightY - padding / 4}
                fill={props.textColor}
                textAnchor="start"
                fontSize={props.fontSize}
                fontFamily={props.fontFamily}
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {props.yRightLabel || ''}
              </text>
            </>
          )
        }
      </svg>
    )
  }

  return render()
}

export default Cross
