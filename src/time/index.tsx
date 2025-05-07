/**
 * @fileOverview 分时图
 * @date 2025-04-24
 * @author poohlaha
 */
import React, { ReactElement, useState } from 'react'
import { AxisDefaultProps, ITimeCrossProps, TimeKDefaultProps } from '../types/component'
import { ITimeProps, TRADE_TIMES } from '../types/time'
import Tooltip from '../components/tooltip'
import dayjs from 'dayjs'
import Utils from '../utils'
import { ITimeKTooltipProps } from '../types/component'
import { Handler, HandleCommon } from '../utils/handler'

const TimeLine: React.FC<ITimeProps> = (props: ITimeProps): ReactElement => {
  const [tooltipProps, setTooltipProps] = useState({ show: false, x: 0, y: 0, data: [] })
  const [crossProps, setCrossProps] = useState({ show: false, x: 0, y: 0, index: 0, yLeftLabel: '', yRightLabel: '' })
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null) // 圆点

  /**
   * 获取交易时间
   */
  const getTradeMinutes = () => {
    let tradTimes = props.tradeTimes || []
    if (tradTimes.length === 0) {
      tradTimes = TRADE_TIMES || []
    }

    // 总时间
    return Utils.getTradingMinutes(tradTimes) || []
  }

  /**
   * 获取价格最小值和最大值
   */
  const getPriceRange = () => {
    const data = props.data || []
    let minPrice = 0
    let maxPrice = 0
    let prices: number[] = []
    let volumes: number[] = []

    if (data.length > 0) {
      prices = data.map(d => d[1])
      volumes = data.map(d => d[2])
      minPrice = Math.min(...prices)
      maxPrice = Math.max(...prices)
    }

    return { prices, minPrice, maxPrice, volumes, data }
  }

  /**
   * 折线图
   */
  const getLine = (
    height: number,
    tradeMinutes: Array<number> = [],
    yLabels: Array<number> = [],
    riseColor: string = '',
    fallColor: string = ''
  ) => {
    const data = props.data || []
    if (data.length === 0) return null

    const width = props.width
    const closingPrice = props.closingPrice ?? 0

    let lineColor = TimeKDefaultProps.defaultColor
    if (closingPrice === 0) {
      const points = data
        .map((d, _) => {
          const price = d[1]
          const index = Utils.getTimeIndexByMinute(d[0], tradeMinutes)
          if (index === -1) return null

          const x = (index / tradeMinutes.length) * width
          const y = Utils.getYPositionPoint(price, yLabels, height) ?? 0

          return `${x},${y}`
        })
        .filter(Boolean)
        .join(' ')

      return (
        <svg width={props.width} height={height}>
          <polyline fill="none" stroke={lineColor} strokeWidth={1} points={points} />
        </svg>
      )
    }

    let lines: Array<React.ReactNode> = []
    for (let i = 1; i < data.length; i++) {
      const [prevTime, prevPrice] = data[i - 1]
      const [currTime, currPrice] = data[i]

      const prevIndex = Utils.getTimeIndexByMinute(prevTime, tradeMinutes)
      const currIndex = Utils.getTimeIndexByMinute(currTime, tradeMinutes)

      if (prevIndex === -1 || currIndex === -1) continue

      const x1 = (prevIndex / tradeMinutes.length) * width
      const x2 = (currIndex / tradeMinutes.length) * width
      const y1 = Utils.getYPositionPoint(prevPrice, yLabels, height) ?? 0
      const y2 = Utils.getYPositionPoint(currPrice, yLabels, height) ?? 0

      // 计算颜色
      let lineColor = TimeKDefaultProps.defaultColor
      if (closingPrice > 0) {
        lineColor = currPrice >= closingPrice ? riseColor || '' : fallColor || ''
      }

      lines.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={lineColor} strokeWidth={1} />)
    }

    return (
      <svg width={props.width} height={height}>
        {lines}
      </svg>
    )
  }

  const onMouseMove = (
    e: React.MouseEvent<SVGSVGElement>,
    tradeMinutes: Array<number>,
    cross: ITimeCrossProps,
    toolTip: ITimeKTooltipProps,
    yLabels: Array<number>,
    height: number,
    riseColor: string = '',
    fallColor: string = ''
  ) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    let mouseY = e.clientY - rect.top

    if (mouseX < 0) {
      return
    }

    // 如果在 X 轴 坐标下面, 则不显示
    const totalMinutes = tradeMinutes.length

    // 鼠标占总宽度的百分比
    const percent = mouseX / props.width
    let minuteIndex = Math.floor(percent * totalMinutes)

    // 限制最大 index 到最后数据点的时间 index
    const lastDataMinute = Utils.getTimeIndexByMinute(props.data[props.data.length - 1][0], tradeMinutes)
    minuteIndex = Math.min(minuteIndex, lastDataMinute)

    // 根据 minuteIndex 反算 mouseX, 保证 cross 不超出最后时间位置, 需要在超出最大时间后 `钉死` 在最大时间点
    const unitX = props.width / totalMinutes
    const fixedMouseX = minuteIndex * unitX

    // 反推数据 index（建立 “分钟索引 -> 数据索引” 映射）
    const dataIndex = props.data.findIndex(d => Utils.getTimeIndexByMinute(d[0], tradeMinutes) === minuteIndex)
    if (dataIndex === -1) return

    const clampedIndex = Math.max(0, Math.min(dataIndex, props.data.length - 1))

    const data = props.data[clampedIndex] || []
    // console.log('data', data, index)
    if (!data || data.length <= 1) return

    // 计算圆点位置
    const positionY = Utils.getYPositionPoint(data[1], yLabels, height) ?? 0
    setFocusPoint({ x: mouseX > fixedMouseX ? fixedMouseX : mouseX, y: positionY })

    if (cross.show) {
      const yPoint = Utils.getPriceByYPosition(mouseY, yLabels, height)
      const yLeftLabel = yPoint === null ? '' : `${yPoint.toFixed(2)}`
      setCrossProps({ show: true, x: fixedMouseX, y: mouseY, index: clampedIndex, yLeftLabel, yRightLabel: yLeftLabel })
    }

    let tooltipData: any = []
    const closingPrice = props.closingPrice ?? 0
    for (let i = 0; i < data.length; i++) {
      const d = data[i]
      let label = ''
      let value: string = ''
      if (i === 0) {
        value = dayjs(d).format('MM-DD HH:mm')
      } else {
        value = Utils.formatNumberUnit(parseFloat(d.toFixed(2)))
      }

      if (i === 0) {
        label = '时间'
      }

      if (i === 1) {
        label = '价格'
      }

      if (i === 2) {
        label = '成交量'
      }

      if (i === 3) {
        label = '成交额'
      }

      tooltipData.push({
        label,
        value
      })

      // 添加在价格后面
      if (i === 1) {
        // 计算涨跌额| 涨跌幅
        if (closingPrice > 0) {
          const price = data[i] - closingPrice
          const { riseAndFall, amplitude } = Utils.onCalculateRiseAndFall(data[i], closingPrice)
          tooltipData.push({
            label: '涨跌额',
            value: `${price > 0 ? '+' : ''}${price.toFixed(2)}`,
            color: price > 0 ? riseColor : price === 0 ? '' : fallColor
          })

          tooltipData.push({
            label: '涨跌幅',
            value: amplitude,
            color: riseAndFall > 0 ? riseColor : price === 0 ? '' : fallColor
          })
        }
      }
    }

    if (toolTip.show) {
      setTooltipProps({
        show: true,
        data: tooltipData,
        x: e.clientX + 10,
        y: e.clientY + 10
      })
    }
  }

  const onMouseLeave = () => {
    setCrossProps({ show: false, x: 0, y: 0, index: 0, yLeftLabel: '', yRightLabel: '' })
    setTooltipProps({ show: false, x: 0, y: 0, data: [] })
    setFocusPoint(null)
  }

  /**
   * 计算 X 轴, Y 轴坐标点
   */
  const onCalculateXYPoints = () => {
    const { maxPrice, minPrice, prices, volumes, data } = getPriceRange()

    const tradeMinutes = getTradeMinutes() // 总时长

    let xLabels = (props.axis || {}).xLabels ?? AxisDefaultProps.xLabels
    if (xLabels.length === 0) {
      xLabels = AxisDefaultProps.xLabels
    }
    const commonProps = Handler.getKTimeProps(props, xLabels, props.closingPrice ?? 0, maxPrice, minPrice)

    return {
      maxPrice,
      minPrice,
      tradeMinutes,
      prices,
      volumes,
      data,
      ...commonProps
    }
  }

  const getTooltip = (tooltip: ITimeKTooltipProps) => {
    if (!tooltip.show) return null

    return (
      <Tooltip
        {...tooltip}
        x={tooltipProps.x ?? 0}
        y={tooltipProps.y ?? 0}
        data={tooltipProps.data || []}
        show={tooltipProps.show}
      />
    )
  }

  const render = () => {
    const {
      yAmplitudes,
      xPoints,
      yPoints,
      width,
      height,
      grid,
      axis,
      highest,
      hasHighest,
      basic,
      hasBasic,
      tradeMinutes,
      yLabels,
      cross,
      tooltip,
      volume,
      data,
      fontSize,
      fontFamily,
      riseColor,
      fallColor
    } = onCalculateXYPoints()
    return (
      <div
        className={`time-k-line flex-center wh100 relative ${props.className || ''}`}
        style={{
          width: props.width,
          height: props.height
        }}
      >
        {/* 背景: 网格和坐标轴 */}
        <svg
          width={props.width}
          height={props.height}
          onMouseMove={e => onMouseMove(e, tradeMinutes, cross, tooltip, yLabels, height, riseColor, fallColor)}
          onMouseLeave={onMouseLeave}
        >
          {/* 背景网格 */}
          {HandleCommon.getGrid(width, height, grid, xPoints, yPoints, axis.isYLeft)}

          {/* x 轴和 y 轴 */}
          {HandleCommon.getAxis(axis, xPoints, yPoints, yAmplitudes)}

          {/* 折线图 */}
          {getLine(height, tradeMinutes, yLabels, riseColor, fallColor)}

          {/* 折线图圆点 */}
          {focusPoint && (
            <circle
              cx={focusPoint.x}
              cy={focusPoint.y}
              r={2} // 圆点半径
              fill={cross.color} // 高亮颜色
              strokeWidth={1}
            />
          )}

          {/* 最高线 */}
          {HandleCommon.getHighest(highest, hasHighest, grid)}

          {/* 基线 */}
          {HandleCommon.getBasic(basic, hasBasic, grid)}

          {/* 十字准线 */}
          {HandleCommon.getCross(cross, crossProps)}

          {/* 成交量柱状图 */}
          {HandleCommon.getVolumeBars(props, volume, data, fontSize, fontFamily, tradeMinutes)}
        </svg>

        {/* ToolTip */}
        {getTooltip(tooltip)}
      </div>
    )
  }

  return render()
}

export default TimeLine
