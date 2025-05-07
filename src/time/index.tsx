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
  AxisTextOffset,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DefaultCrossProps,
  GridDefaultProps,
  HighestDefaultProps,
  ITimeAxisProps,
  ITimeCrossProps,
  ITimeGridProps,
  ITimeHighestProps,
  ITimeProps,
  IVolumeProps,
  LineType,
  TimeDefaultProps,
  TRADE_TIMES,
  VolumeDefaultProps
} from '../types/time'
import Highest from './lib/highest'
import Tooltip from '../components/tooltip'
import Cross from './lib/cross'
import dayjs from 'dayjs'
import Utils from '../utils'
import { ITimeKTooltipProps, TooltipDefaultDataProps } from '../types/component'
import Volume from './volume'

const Timer: React.FC<ITimeProps> = (props: ITimeProps): ReactElement => {
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
   * 获取坐标属性
   */
  const getAxisProps = (
    fontSize: number,
    fontFamily: string,
    width: number,
    height: number,
    axisPadding: number,
    totalWidth: number,
    totalHeight: number
  ) => {
    const axis = props.axis
    const yPosition = axis.yPosition ?? AxisDefaultProps.yPosition
    const isYLeft = yPosition === 'left'
    let xLabels = axis.xLabels ?? AxisDefaultProps.xLabels
    if (xLabels.length === 0) {
      xLabels = AxisDefaultProps.xLabels
    }

    const lineColor = axis.lineColor ?? AxisDefaultProps.lineColor
    const textColor = axis.textColor ?? AxisDefaultProps.textColor
    const needXLabelLine = axis.needXLabelLine ?? AxisDefaultProps.needXLabelLine
    const needYLabelLine = axis.needYLabelLine ?? AxisDefaultProps.needYLabelLine
    const needAxisXLine = axis.needAxisXLine ?? AxisDefaultProps.needAxisXLine
    const needAxisYLine = axis.needAxisYLine ?? AxisDefaultProps.needAxisYLine
    return {
      ...axis,
      padding: axisPadding,
      fontSize,
      fontFamily,
      lineColor,
      textColor,
      axisPadding,
      yPosition,
      isYLeft,
      xLabels,
      needXLabelLine,
      needYLabelLine,
      needAxisXLine,
      needAxisYLine,
      width,
      height,
      totalWidth,
      totalHeight,
      xPoints: [],
      yPoints: [],
      yAmplitudes: []
    } as ITimeAxisProps
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
    volume: { [K: string]: any } = {}
  ) => {
    const data = props.data || []
    if (data.length === 0) return null

    const width = props.width
    const closingPrice = props.closingPrice ?? 0

    let lineColor = TimeDefaultProps.defaultColor
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
      let lineColor = TimeDefaultProps.defaultColor
      if (closingPrice > 0) {
        lineColor = currPrice >= closingPrice ? volume.riseColor || '' : volume.fallColor || ''
      }

      lines.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={lineColor} strokeWidth={1} />)
    }

    return (
      <svg width={props.width} height={height}>
        {lines}
      </svg>
    )
  }

  const getBasicShow = () => {
    const basic = props.basic
    if (basic === undefined) {
      return false
    }

    return basic.show!
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
    yLabels: Array<number>,
    closingPrice: number
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
    const y = Utils.getYPositionPoint(basic.data, yLabels, height)

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
      isAxisLeft: isYLeft,
      closingPrice,
      className: 'time-k-basic',
      hasHighest: false
    } as ITimeHighestProps
  }

  /**
   * 基线
   */
  const getBasic = (basic: ITimeHighestProps, hasBasic: boolean, grid: ITimeGridProps) => {
    if (hasBasic) {
      if (grid.show) {
        return null
      }
    }

    const show = basic.show ?? true
    if (!show) return null

    return <Highest {...basic} hasHighest={hasBasic} />
  }

  /**
   * 获取最高线属性
   */
  const getHighestProps = (
    width: number,
    height: number,
    price: number,
    fontSize: number,
    fontFamily: string,
    isYLeft: boolean,
    yLabels: Array<number>,
    closingPrice: number
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
    const y = Utils.getYPositionPoint(price, yLabels, height)

    return {
      show: true,
      lineColor,
      textColor,
      lineType,
      width,
      height,
      price,
      fontSize,
      fontFamily,
      y,
      isAxisLeft: isYLeft,
      closingPrice
    } as ITimeHighestProps
  }

  /**
   * 最高线
   */
  const getHighest = (highest: ITimeHighestProps, hasHighest: boolean, grid: ITimeGridProps) => {
    if (hasHighest) {
      // 如果背景显示, 则不画线
      if (grid.show) {
        return null
      }
    }

    const show = highest.show ?? true
    if (!show) return null

    return <Highest {...highest} hasHighest={hasHighest} />
  }

  /**
   * 获取十字准线属性
   */
  const getCrossProps = (
    width: number,
    height: number,
    volume: IVolumeProps,
    fontSize: number,
    fontFamily: string,
    isAxisLeft: boolean,
    closingPrice: number = 0
  ) => {
    const crossProps: { [K: string]: any } = props.cross || {}
    const show = crossProps.show ?? true
    if (!show) {
      return {
        show: false
      } as ITimeCrossProps
    }

    const color = Utils.isBlank(crossProps.color || '') ? DefaultCrossProps.color : crossProps.color || ''
    const textColor = Utils.isBlank(crossProps.textColor || '')
      ? DefaultCrossProps.textColor
      : crossProps.textColor || ''
    const textBackgroundColor = Utils.isBlank(crossProps.textBackgroundColor || '')
      ? DefaultCrossProps.textBackgroundColor
      : crossProps.textBackgroundColor || ''
    const lineType = crossProps.lineType ?? (DefaultCrossProps.lineType as LineType)
    return {
      show: true,
      color,
      textColor,
      lineType,
      width,
      height: volume.show ? props.height : height,
      fontSize,
      fontFamily,
      textBackgroundColor,
      isAxisLeft,
      closingPrice
    } as ITimeCrossProps
  }

  /**
   * 十字准线
   */
  const getCross = (cross: ITimeCrossProps) => {
    if (!cross.show) return null

    return (
      <Cross
        {...cross}
        x={crossProps.x}
        y={crossProps.y}
        show={crossProps.show}
        yLeftLabel={crossProps.yLeftLabel}
        yRightLabel={crossProps.yRightLabel}
      />
    )
  }

  const onMouseMove = (
    e: React.MouseEvent<SVGSVGElement>,
    tradeMinutes: Array<number>,
    cross: ITimeCrossProps,
    toolTip: ITimeKTooltipProps,
    yLabels: Array<number>,
    height: number,
    volume: { [K: string]: any }
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
            color: price > 0 ? volume.riseColor : price === 0 ? '' : volume.fallColor
          })

          tooltipData.push({
            label: '涨跌幅',
            value: amplitude,
            color: riseAndFall > 0 ? volume.riseColor : price === 0 ? '' : volume.fallColor
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
    const fontSize = props.fontSize ?? DEFAULT_FONT_SIZE
    const fontFamily = props.fontFamily ?? DEFAULT_FONT_FAMILY
    const axisPadding =
      props.axis.padding === null || props.axis.padding === undefined ? AxisDefaultProps.padding : props.axis.padding // 在 坐标轴内部画线
    const volume = getVolumeProps()

    const width = props.width
    const height = props.height - axisPadding - (volume.show ? volume.height || 0 : 0)

    const axis = getAxisProps(fontSize, fontFamily, width, height, axisPadding, props.width, props.height)
    const { maxPrice, minPrice, prices, volumes, data } = getPriceRange()

    const tooltip = getTooltipProp()
    const cross = getCrossProps(width, height, volume, fontSize, fontFamily, axis.isYLeft, props.closingPrice ?? 0)
    const tradeMinutes = getTradeMinutes() // 总时长
    const grid = getGridProps()
    const basicShow = getBasicShow()
    const { yLabels, newMaxPrice, newMinPrice, yAmplitudes } =
      Utils.onCalculateYLabels(
        grid.horizontalLines,
        props.axis,
        maxPrice,
        minPrice,
        basicShow ? props.basic?.data : 0,
        props.closingPrice ?? 0
      ) || []

    const highest = getHighestProps(
      width,
      height,
      maxPrice,
      fontSize,
      fontFamily,
      axis.isYLeft,
      yLabels,
      props.closingPrice ?? 0
    )
    const basic = getBasicProps(width, height, fontSize, fontFamily, axis.isYLeft, yLabels, props.closingPrice ?? 0)

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
      axis,
      maxPrice,
      minPrice,
      newMaxPrice,
      newMinPrice,
      tradeMinutes,
      xPoints,
      yPoints,
      yLabels,
      yAmplitudes,
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
      tooltip,
      volume,
      prices,
      volumes,
      data
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

  /**
   * 获取成交量柱状图属性
   */
  const getVolumeProps = () => {
    const volume = props.volume || {}
    if (volume.show === false) {
      return {
        show: false
      }
    }

    const riseColor = Utils.isBlank(props.riseColor || '') ? TimeDefaultProps.riseColor : props.riseColor || ''
    const fallColor = Utils.isBlank(props.fallColor || '') ? TimeDefaultProps.fallColor : props.fallColor || ''
    const height = volume.height ?? VolumeDefaultProps.height
    return {
      show: true,
      riseColor,
      fallColor,
      height
    }
  }

  /**
   * 成交量柱状图
   */
  const getVolumeBars = (
    volumeProps: { [K: string]: any },
    data: Array<number[]> = [],
    fontSize: number,
    fontFamily: string,
    tradeMinutes: Array<number> = []
  ) => {
    if (!volumeProps.show) return null

    let totalCount = 0
    if (data.length > 0) {
      let results = data[data.length - 1]
      if (results.length > 0) {
        totalCount = results[2]
      }
    }

    const maxVolume = Math.max(...data.map(d => d[2]))
    const volumeHeight = volumeProps.height ?? VolumeDefaultProps.height
    return (
      <svg width={props.width} height={props.height} className="time-k-volume">
        <text
          x={AxisTextOffset}
          y={props.height - volumeHeight + AxisTextOffset}
          fill={volumeProps.textColor}
          textAnchor="start"
          fontSize={fontSize}
          fontFamily={fontFamily}
        >
          成交量{Utils.formatNumberUnit(totalCount)}手
        </text>

        {data.length > 0 &&
          data.map((item, index: number) => {
            const [time, price, volume] = item
            const prevPrice = index > 0 ? data[index - 1][1] : price
            const color = price >= prevPrice ? volumeProps.riseColor || '' : volumeProps.fallColor || ''
            const barWidth = props.width / tradeMinutes.length
            const barHeight = (volume / maxVolume) * volumeHeight
            const timeIndex = Utils.getTimeIndexByMinute(time, tradeMinutes)
            if (timeIndex === -1) return null

            const x = timeIndex * barWidth
            return (
              <Volume
                key={index}
                x={x}
                y={props.height - barHeight}
                width={barWidth}
                height={barHeight}
                color={color}
              />
            )
          })}
      </svg>
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
      fontFamily
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
          onMouseMove={e => onMouseMove(e, tradeMinutes, cross, tooltip, yLabels, height, volume)}
          onMouseLeave={onMouseLeave}
        >
          {/* 背景网格 */}
          {getGrid(width, height, grid, xPoints, yPoints, axis.isYLeft)}

          {/* x 轴和 y 轴 */}
          <Axis {...axis} xPoints={xPoints} yPoints={yPoints} yAmplitudes={yAmplitudes} />

          {/* 折线图 */}
          {getLine(height, tradeMinutes, yLabels, volume)}

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
          {getHighest(highest, hasHighest, grid)}

          {/* 基线 */}
          {getBasic(basic, hasBasic, grid)}

          {/* 十字准线 */}
          {getCross(cross)}

          {/* 成交量柱状图 */}
          {getVolumeBars(volume, data, fontSize, fontFamily, tradeMinutes)}
        </svg>

        {/* ToolTip */}
        {getTooltip(tooltip)}
      </div>
    )
  }

  return render()
}

export default Timer
