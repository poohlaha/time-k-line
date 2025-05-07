/**
 * @fileOverview K 线图
 * @date 2023-08-28
 * @author poohlaha
 */
import React, { ReactElement } from 'react'
import { IKProps, KDefaultProps } from '../types/k'
import { Handler, HandleCommon } from '../utils/handler'
import Utils from '../utils'
import dayjs from 'dayjs'
import { GridDefaultProps } from '../types/component'

const KLine = (props: IKProps): ReactElement => {
  /**
   * 获取价格最小值和最大值
   */
  const getPriceRange = () => {
    // 网格背景
    const grid = Handler.getGridProps(props)
    const verticalLines = grid.verticalLines ?? GridDefaultProps.verticalLines

    const data = props.data || []
    let minPrice = 0
    let maxPrice = 0
    let volumes: number[] = []

    let xLabels: Array<string> = []
    if (data.length > 0) {
      const prices = data.flatMap(d => [d[2], d[3]])
      volumes = data.map(d => d[5])
      minPrice = Math.min(...prices)
      maxPrice = Math.max(...prices)

      // 获取 x 坐标轴
      if (verticalLines > 0) {
        const labels: { label: string; index: number }[] = []
        const step = Math.floor(data.length / verticalLines)
        for (let i = 0; i < data.length; i += step) {
          const timestamp = data[i][0]
          const label = dayjs(timestamp).format('YYYY-MM')
          labels.push({ label, index: i })
          xLabels.push(label)
        }

        // 保证最后一个也被加进去
        if (labels[labels.length - 1]?.index !== data.length - 1) {
          const last = data[data.length - 1]
          xLabels.push(dayjs(last[0]).format('YYYY-MM'))
        }
      }
    }

    return { minPrice, maxPrice, volumes, data, xLabels }
  }

  /**
   * 计算 X 轴, Y 轴坐标点
   */
  const onCalculateXYPoints = () => {
    const { maxPrice, minPrice, volumes, data, xLabels } = getPriceRange()
    const commonProps = Handler.getKTimeProps(props, xLabels, props.closingPrice ?? 0, maxPrice, minPrice)

    return {
      maxPrice,
      minPrice,
      volumes,
      data,
      ...commonProps
    }
  }

  const getNode = () => {
    const { maxPrice, minPrice, data, height, riseColor, fallColor, width, grid, xPoints, yPoints, axis } =
      onCalculateXYPoints()

    if (data.length === 0) return null

    const flatColor = Utils.isBlank(props.flatColor || '') ? KDefaultProps.flatColor : props.flatColor || ''

    // const padding = 20
    const candleWidth = 6
    const gap = 4

    const scaleFactor = 1.2
    const padding = (maxPrice - minPrice) * 0.05
    const adjustedMax = maxPrice + padding
    const adjustedMin = minPrice - padding
    const priceRange = adjustedMax - adjustedMin

    const pixelPerPrice = (height * scaleFactor) / priceRange
    const scaleY = (price: number) => (adjustedMax - price) * pixelPerPrice

    return (
      <svg width={props.width} height={props.height}>
        {/* 背景网格 */}
        {HandleCommon.getGrid(width, height, grid, xPoints, yPoints, axis.isYLeft)}

        {/* x 轴和 y 轴 */}
        {HandleCommon.getAxis(axis, xPoints, yPoints)}

        {data.map((item, index) => {
          const x = index * (candleWidth + gap) + padding
          const open = item[1] ?? 0
          const close = item[4] ?? 0
          const yOpen = scaleY(open)
          const yHigh = scaleY(item[2] ?? 0)
          const yLow = scaleY(item[3] ?? 0)
          const yClose = scaleY(close)

          const candleColor =
            close > open
              ? riseColor // 涨红
              : close < open
                ? fallColor // 跌绿
                : flatColor // 平灰

          const candleTop = Math.min(yOpen, yClose)
          const candleHeight = Math.max(Math.abs(yClose - yOpen), 2) // 保证最小高度为2px

          return (
            <g key={item[0]}>
              {/* 高低线 */}
              <line
                x1={x + candleWidth / 2}
                y1={yHigh}
                x2={x + candleWidth / 2}
                y2={yLow}
                stroke={candleColor}
                strokeWidth={1}
              />
              {/* 实体矩形 */}
              <rect x={x} y={candleTop} width={candleWidth} height={candleHeight} fill={candleColor} />
            </g>
          )
        })}
      </svg>
    )
  }

  const render = () => {
    return (
      <div
        className={`time-k-line flex-center wh100 relative ${props.className || ''}`}
        style={{
          width: props.width,
          height: props.height
        }}
      >
        {getNode()}
      </div>
    )
  }

  return render()
}

export default KLine
