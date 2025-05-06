/**
 * @fileOverview 分时图
 * @date 2025-04-24
 * @author poohlaha
 */
import React, { ReactElement, useState } from 'react'
import Grid from './lib/grid'
import Axis from './lib/axis'
import {
  AxisDefaultProps,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DefaultCrossProps,
  GridDefaultProps,
  HighestDefaultProps,
  ITimeCrossProps,
  ITimeGridProps,
  ITimeHighestProps,
  ITimeProps,
  LineType,
  TimeDefaultProps,
  TRADE_TIMES
} from '../types/time'
import Highest from './lib/highest'
import Tooltip from '../components/tooltip'
import Cross from './lib/cross'
import dayjs from 'dayjs'
import Utils from '../utils'
import { ITimeKTooltipProps, TooltipDefaultDataProps } from '../types/component'

const Timer: React.FC<ITimeProps> = (props: ITimeProps): ReactElement => {
  const [tooltipProps, setTooltipProps] = useState({ show: false, x: 0, y: 0, data: [] })
  const [crossProps, setCrossProps] = useState({ show: false, x: 0, y: 0, index: 0 })
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
   * 获取坐标属性
   */
  const getAxisProps = () => {
    const axis = props.axis
    const axisPadding = axis.padding === null || axis.padding === undefined ? AxisDefaultProps.padding : axis.padding // 在 坐标轴内部画线
    const yPosition = axis.yPosition ?? AxisDefaultProps.yPosition
    const isYRight = yPosition === 'right'
    const isYLeft = yPosition === 'left'
    let xLabels = axis.xLabels ?? AxisDefaultProps.xLabels
    if (xLabels.length === 0) {
      xLabels = AxisDefaultProps.xLabels
    }

    const needXLine = axis.needXLine ?? AxisDefaultProps.needXLine
    const needYLine = axis.needYLine ?? AxisDefaultProps.needYLine
    return { ...axis, axisPadding, yPosition, isYRight, isYLeft, xLabels, needXLine, needYLine }
  }

  /**
   * 获取网格属性
   */
  const getGridProps = (): ITimeGridProps => {
    const grid = props.grid
    const verticalLines = GridDefaultProps.verticalLines
    const horizontalLines = GridDefaultProps.horizontalLines

    if (grid === undefined) {
      return {
        verticalLines,
        horizontalLines,
        show: false
      } as ITimeGridProps
    }

    return {
      ...grid,
      verticalLines,
      horizontalLines: grid.verticalLines ?? GridDefaultProps.horizontalLines
    } as ITimeGridProps
  }

  /**
   * 背景网格
   */
  const getGrid = (
    width: number,
    height: number,
    grid: ITimeGridProps,
    xPoints: Array<{ [K: string]: any }> = [],
    yPoints: Array<{ [K: string]: any }> = [],
    isYLeft: boolean
  ) => {
    if (grid.show === false) {
      return null
    }

    return <Grid {...grid} width={width} height={height} xPoints={xPoints} yPoints={yPoints} isYLeft={isYLeft} />
  }

  /**
   * 获取价格最小值和最大值
   */
  const getPriceRange = () => {
    const data = props.data || []
    let minPrice = 0
    let maxPrice = 0
    let prices: number[] = []

    if (data.length > 0) {
      prices = data.map(d => d[1])
      minPrice = Math.min(...prices)
      maxPrice = Math.max(...prices)
    }

    return { prices, minPrice, maxPrice }
  }

  /**
   * 折线图
   */
  const getLine = (height: number, tradeMinutes: Array<number> = [], yLabels: Array<number> = []) => {
    const data = props.data || []
    if (data.length === 0) return null

    const width = props.width
    const lineColor = props.lineColor ?? TimeDefaultProps.lineColor

    const points = data
      .map((d, _) => {
        const index = Utils.getTimeIndexByMinute(d[0], tradeMinutes)
        if (index === -1) return null

        const x = (index / tradeMinutes.length) * width
        const y = getYPositionPoint(d[1], yLabels, height) ?? 0
        return `${x},${y}`
      })
      .filter(Boolean)
      .join(' ')

    return <polyline fill="none" stroke={lineColor} strokeWidth={1} points={points} />
  }

  /**
   * 获取 basic 属性
   */
  const getBasicProps = (
    width: number,
    height: number,
    fontSize: number,
    fontFamily: string,
    isYLeft: boolean,
    yLabels: Array<number>
  ) => {
    const basic = props.basic
    if (basic === undefined) {
      return {
        show: false
      } as ITimeHighestProps
    }

    const show = basic.show ?? true
    if (!show) {
      return {
        show: false
      } as ITimeHighestProps
    }

    const lineColor = basic.lineColor ?? HighestDefaultProps.lineColor
    const textColor = basic.textColor ?? HighestDefaultProps.textColor
    const lineType = basic.lineType ?? HighestDefaultProps.lineType
    const y = getYPositionPoint(basic.data, yLabels, height)

    return {
      ...basic,
      lineColor,
      textColor,
      lineType,
      width,
      height,
      price: basic.data,
      fontSize,
      fontFamily,
      y,
      isAxisLeft: isYLeft
    } as ITimeHighestProps
  }

  /**
   * 基线
   */
  const getBasic = (basic: ITimeHighestProps, hasBasic: boolean) => {
    if (hasBasic) return null

    const show = basic.show ?? true
    if (!show) return null

    return <Highest {...basic} />
  }

  /**
   * 获取最高线属性
   */
  const getHighestProps = (
    width: number,
    height: number,
    maxPrice: number,
    fontSize: number,
    fontFamily: string,
    isYLeft: boolean,
    yLabels: Array<number>
  ) => {
    const highest = props.highest
    if (highest === undefined) {
      return {
        show: false
      } as ITimeHighestProps
    }

    const show = highest.show
    if (show === false) {
      return {
        show: false
      } as ITimeHighestProps
    }

    const lineColor = highest.lineColor ?? HighestDefaultProps.lineColor
    const textColor = highest.textColor ?? HighestDefaultProps.textColor
    const lineType = highest.lineType ?? HighestDefaultProps.lineType
    const y = getYPositionPoint(maxPrice, yLabels, height)

    return {
      show: true,
      lineColor,
      textColor,
      lineType,
      width,
      height,
      price: maxPrice,
      fontSize,
      fontFamily,
      y,
      isAxisLeft: isYLeft
    } as ITimeHighestProps
  }

  /**
   * 计算线条位置
   */
  const getYPositionPoint = (value: number, yLabels: Array<number>, height: number) => {
    if (yLabels.length === 0) return null
    let min = yLabels[0]
    let max = yLabels[yLabels.length - 1]
    if (value < min || value > max) return null

    if (value === min) {
      return min
    }

    if (value === max) {
      return min
    }

    const percent = (max - value) / (max - min)
    return Number((percent * height).toFixed(2))
  }

  /**
   * 最高线
   */
  const getHighest = (highest: ITimeHighestProps, hasHighest: boolean) => {
    if (hasHighest) return null

    const show = highest.show ?? true
    if (!show) return null

    return <Highest {...highest} />
  }

  /**
   * 获取十字准线属性
   */
  const getCrossProps = (width: number, height: number) => {
    const crossProps = props.cross || {}
    const show = crossProps.show ?? true
    if (!show) {
      return {
        show: false
      } as ITimeCrossProps
    }

    const color = crossProps.color ?? DefaultCrossProps.color
    const lineType = crossProps.lineType ?? (DefaultCrossProps.lineType as LineType)
    return {
      show: true,
      color,
      lineType,
      width,
      height
    } as ITimeCrossProps
  }

  /**
   * 十字准线
   */
  const getCross = (cross: ITimeCrossProps) => {
    if (!cross.show) return null

    return <Cross {...cross} x={crossProps.x} y={crossProps.y} show={crossProps.show} />
  }

  const onMouseMove = (
    e: React.MouseEvent<SVGSVGElement>,
    tradeMinutes: Array<number>,
    cross: ITimeCrossProps,
    toolTip: ITimeKTooltipProps,
    yLabels: Array<number>,
    height: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    let mouseY = e.clientY - rect.top
    const { axisPadding } = getAxisProps()

    if (mouseX < 0) {
      return
    }

    // 如果在 X 轴 坐标下面, 则不显示
    if (props.height - mouseY < axisPadding) {
      return
    }

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
    if (cross.show) {
      setCrossProps({ show: true, x: fixedMouseX, y: mouseY, index: clampedIndex })
    }

    const data = props.data[clampedIndex] || []
    // console.log('data', data, index)
    if (!data || data.length <= 1) return

    // 计算圆点位置
    const positionY = getYPositionPoint(data[1], yLabels, height) ?? 0
    setFocusPoint({ x: mouseX > fixedMouseX ? fixedMouseX : mouseX, y: positionY })

    let tooltipData: any = []

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
    setCrossProps({ show: false, x: 0, y: 0, index: 0 })
    setTooltipProps({ show: false, x: 0, y: 0, data: [] })
    setFocusPoint(null)
  }

  const getTooltipProp = () => {
    const tooltip = props.tooltip || {}
    const show = tooltip.show
    if (show === false) {
      return {
        show: false
      } as ITimeKTooltipProps
    }

    const width = tooltip.width ?? TooltipDefaultDataProps.width
    const height = tooltip.height
    const className = tooltip.className || ''
    const background = tooltip.background ?? TooltipDefaultDataProps.background
    return {
      show: true,
      width,
      height,
      className,
      background
    } as ITimeKTooltipProps
  }

  /**
   * 计算 X 轴, Y 轴坐标点
   */
  const onCalculateXYPoints = () => {
    const axis = getAxisProps()
    const { maxPrice, minPrice } = getPriceRange()

    const width = props.width
    const height = props.height - axis.axisPadding
    const fontSize = props.fontSize ?? DEFAULT_FONT_SIZE
    const fontFamily = props.fontFamily ?? DEFAULT_FONT_FAMILY

    const tooltip = getTooltipProp()
    const cross = getCrossProps(width, height)
    const tradeMinutes = getTradeMinutes() // 总时长
    const grid = getGridProps()
    const yLabels = Utils.onCalculateYLabels(grid.horizontalLines, props.axis, maxPrice, minPrice) || []

    const highest = getHighestProps(width, height, maxPrice, fontSize, fontFamily, axis.isYLeft, yLabels)
    const basic = getBasicProps(width, height, fontSize, fontFamily, axis.isYLeft, yLabels)

    // const yPrices = Utils.getTradingPrices(yLabels)
    const xPoints: Array<{ [K: string]: any }> = Utils.onCalculateXPoints(
      width,
      height,
      axis.isYLeft,
      props.fontSize,
      axis.xLabels
    )

    const { yPoints, hasHighest, hasBasic } = Utils.onCalculateYPoints(
      width,
      height,
      axis.isYLeft,
      fontSize,
      fontFamily,
      yLabels,
      maxPrice,
      highest,
      basic
    )

    return {
      ...axis,
      maxPrice,
      minPrice,
      tradeMinutes,
      xPoints,
      yPoints,
      yLabels,
      grid,
      width,
      height,
      highest,
      hasHighest,
      basic,
      hasBasic,
      fontSize,
      fontFamily,
      cross,
      tooltip
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
      needXLine,
      needYLine,
      maxPrice,
      minPrice,
      xPoints,
      yPoints,
      width,
      height,
      grid,
      isYLeft,
      highest,
      hasHighest,
      basic,
      hasBasic,
      tradeMinutes,
      yLabels,
      cross,
      tooltip
    } = onCalculateXYPoints()
    return (
      <div className="timer-page flex-center wh100 relative">
        {/* 背景: 网格和坐标轴 */}
        <svg
          width={props.width}
          height={props.height}
          onMouseMove={e => onMouseMove(e, tradeMinutes, cross, tooltip, yLabels, height)}
          onMouseLeave={onMouseLeave}
        >
          {/* 背景网格 */}
          {getGrid(width, height, grid, xPoints, yPoints, isYLeft)}

          {/* x 轴和 y 轴 */}
          <Axis
            width={width}
            height={height}
            maxPrice={maxPrice}
            minPrice={minPrice}
            xPoints={xPoints}
            yPoints={yPoints}
            isYLeft={isYLeft}
            needXLine={needXLine}
            needYLine={needYLine}
            totalWidth={props.width}
            totalHeight={props.height}
          />

          {/* 折线图 */}
          {getLine(height, tradeMinutes, yLabels)}

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
          {getHighest(highest, hasHighest)}

          {/* 基线 */}
          {getBasic(basic, hasBasic)}

          {/* 十字准线 */}
          {getCross(cross)}
        </svg>

        {/* ToolTip */}
        {getTooltip(tooltip)}
      </div>
    )
  }

  return render()
}

export default Timer
