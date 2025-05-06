/**
 * @fileOverview X 轴 | Y 轴坐标
 * @date 2023-08-28
 * @author poohlaha
 */
import React, { ReactElement } from 'react'
import { AxisDefaultProps, DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, ITimeAxisProps } from '../../types/time'

const Axis: React.FC<ITimeAxisProps> = (props: ITimeAxisProps): ReactElement => {
  const render = () => {
    let lineColor = props.lineColor ?? AxisDefaultProps.lineColor
    let textColor = props.textColor ?? AxisDefaultProps.textColor
    const fontSize = props.fontSize ?? DEFAULT_FONT_SIZE
    const fontFamily = props.fontFamily ?? DEFAULT_FONT_FAMILY

    const isYLeft = props.isYLeft
    const xPoints = props.xPoints || []
    const yPoints = props.yPoints || []

    return (
      <>
        <svg width={props.width} height={props.height}>
          {/* x 轴线(减去1避免覆盖 Y 轴 */}
          <line x1={0} y1={props.height - 0.5} x2={props.width} y2={props.height - 0.5} stroke={lineColor} />

          {/* y 轴线(不画到底，避免与 X 轴重合) */}
          <line
            x1={isYLeft ? 0 : props.width}
            y1={0}
            x2={isYLeft ? 0 : props.width}
            y2={props.height}
            stroke={lineColor}
          />
        </svg>

        {/* y轴刻度线和文字 */}
        <svg width={props.width} height={props.height}>
          {yPoints.length > 0 &&
            yPoints.map((point, i) => {
              const line = point.line || {}
              const text = point.text || {}
              const needLine = point.needLine
              let newLineColor = lineColor

              // 最高线
              const highest = point.highest || {}
              let newTextColor = textColor
              if (highest.show && highest.isHighest) {
                newLineColor = highest.lineColor
                newTextColor = highest.textColor
              }

              // 基线
              const basic = point.basic || {}
              if (basic.show && basic.isBasic) {
                newLineColor = basic.lineColor
                newTextColor = basic.textColor
              }

              return (
                <g key={`y-${i}`}>
                  {/* 第一个不要显示刻度线 */}
                  {needLine && props.needYLine && (
                    <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={newLineColor} />
                  )}
                  <text
                    x={text.x}
                    y={text.y}
                    fill={newTextColor}
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    textAnchor={text.anchor}
                    style={{ userSelect: 'none', pointerEvents: 'none' }}
                  >
                    {point.label || ''}
                  </text>
                </g>
              )
            })}
        </svg>

        {/* x 轴刻度线和文字, 第一个和最后一个要单独处理, 防止遮挡 */}
        <svg width={props.width} height={props.totalHeight}>
          {xPoints.map((point, i: number) => {
            const line = point.line || {}
            const text = point.text || {}
            const needLine = point.needLine

            return (
              <g key={`x-${i}`}>
                {needLine && props.needXLine && (
                  <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={lineColor} />
                )}
                <text
                  x={text.x}
                  y={text.y}
                  fill={textColor}
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                  textAnchor={text.anchor}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {point.label || ''}
                </text>
              </g>
            )
          })}
        </svg>
      </>
    )
  }

  return render()
}

export default Axis
