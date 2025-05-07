/**
 * @fileOverview 分时图和 K 线图公共方法
 * @date 2025-05-07
 * @author poohlaha
 */
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
  ITimeKProps,
  ITimeKTooltipProps,
  IVolumeProps,
  LineType,
  TimeKDefaultProps,
  TooltipDefaultDataProps,
  VolumeDefaultProps
} from '../types/component'
import Utils from './index'
import React from 'react'
import Grid from '../components/grid'
import Axis from '../components/axis'
import Highest from '../components/highest'
import Cross from '../components/cross'
import Volume from '../components/volume'

const Handler = {
  /**
   * 获取网格属性
   */
  getGridProps: (props: ITimeKProps) => {
    const grid = props.grid
    const verticalLines = GridDefaultProps.verticalLines // 垂直条数(X轴)
    const horizontalLines = GridDefaultProps.horizontalLines // 水平线条数(Y轴)

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
      horizontalLines
    } as ITimeGridProps
  },

  /**
   * 获取坐标属性
   */
  getAxisProps: (
    props: ITimeKProps,
    xLabels: Array<string>,
    fontSize: number,
    fontFamily: string,
    width: number,
    height: number,
    axisPadding: number,
    totalWidth: number,
    totalHeight: number
  ) => {
    const axis = props.axis || {}
    const yPosition = axis.yPosition ?? AxisDefaultProps.yPosition
    const isYLeft = yPosition === 'left'
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
  },

  /**
   * 获取十字准线属性
   */
  getCrossProps: (
    props: ITimeKProps,
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
  },

  /**
   * 是否显示基准线
   */
  getBasicShow: (props: ITimeKProps) => {
    const basic = props.basic
    if (basic === undefined) {
      return false
    }

    return basic.show
  },

  /**
   * 获取最高线属性
   */
  getHighestProps: (
    props: ITimeKProps,
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
  },

  /**
   * 获取 基线 属性
   */
  getBasicProps: (
    props: ITimeKProps,
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
  },

  /**
   * 获取成交量柱状图属性
   */
  getVolumeProps: (props: ITimeKProps, riseColor: string = '', fallColor: string = '') => {
    const volume = props.volume || {}
    if (volume.show === false) {
      return {
        show: false
      }
    }

    const height = volume.height ?? VolumeDefaultProps.height
    return {
      show: true,
      riseColor,
      fallColor,
      height
    }
  },

  /**
   * Tooltip 属性
   */
  getTooltipProp: (props: ITimeKProps) => {
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
  },

  /**
   * 获取分时图默认属性
   */
  getKTimeProps: (
    props: ITimeKProps,
    xLabels: Array<string> = [],
    closingPrice: number = 0,
    maxPrice: number = 0,
    minPrice: number = 0
  ) => {
    // 字体大小
    const fontSize = props.fontSize ?? DEFAULT_FONT_SIZE

    // 字体名称
    const fontFamily = Utils.isBlank(props.fontFamily || '') ? DEFAULT_FONT_FAMILY : props.fontFamily || ''

    // 涨颜色
    const riseColor = Utils.isBlank(props.riseColor || '') ? TimeKDefaultProps.riseColor : props.riseColor || ''

    // 跌颜色
    const fallColor = Utils.isBlank(props.fallColor || '') ? TimeKDefaultProps.fallColor : props.fallColor || ''

    const basicShow = Handler.getBasicShow(props)

    // axis label height
    const axisPadding =
      (props.axis || {}).padding === null || (props.axis || {}).padding === undefined
        ? AxisDefaultProps.padding
        : ((props.axis || {}).padding ?? 0)

    // 成交量柱状图
    const volume = Handler.getVolumeProps(props, riseColor, fallColor)

    // width
    const width = props.width

    // height
    const height = props.height - axisPadding - (volume.show ? volume.height || 0 : 0)

    // 网格背景
    const grid = Handler.getGridProps(props)

    // 坐标轴
    const axis = Handler.getAxisProps(
      props,
      xLabels,
      fontSize,
      fontFamily,
      width,
      height,
      axisPadding,
      props.width,
      props.height
    )

    // 十字准线
    const cross = Handler.getCrossProps(
      props,
      width,
      height,
      volume,
      fontSize,
      fontFamily,
      axis.isYLeft,
      closingPrice ?? 0
    )

    const { yLabels, newMaxPrice, newMinPrice, yAmplitudes } =
      Utils.onCalculateYLabels(
        grid.horizontalLines,
        axis,
        maxPrice,
        minPrice,
        basicShow ? props.basic?.data : 0,
        closingPrice ?? 0
      ) || []

    // 最高线
    const highest = Handler.getHighestProps(
      props,
      width,
      height,
      maxPrice,
      fontSize,
      fontFamily,
      axis.isYLeft,
      yLabels,
      closingPrice ?? 0
    )

    // 基线
    const basic = Handler.getBasicProps(
      props,
      width,
      height,
      fontSize,
      fontFamily,
      axis.isYLeft,
      yLabels,
      closingPrice ?? 0
    )

    // tooltip
    const tooltip = Handler.getTooltipProp(props)

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
      fontSize,
      fontFamily,
      riseColor,
      fallColor,
      axisPadding,
      volume,
      width,
      height,
      grid,
      axis,
      cross,
      highest,
      basic,
      tooltip,
      xLabels,
      yLabels,
      basicShow,
      newMaxPrice,
      newMinPrice,
      yAmplitudes,
      xPoints,
      yPoints,
      hasHighest,
      hasBasic
    }
  }
}

const HandleCommon = {
  /**
   * 背景网格
   */
  getGrid: (
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
  },

  /**
   * x 轴和 y 轴
   */
  getAxis: (
    axis: ITimeAxisProps,
    xPoints: Array<{ [K: string]: any }> = [],
    yPoints: Array<{ [K: string]: any }> = [],
    yAmplitudes: Array<string> = []
  ) => {
    return <Axis {...axis} xPoints={xPoints} yPoints={yPoints} yAmplitudes={yAmplitudes} />
  },

  /**
   * 最高线
   */
  getHighest: (highest: ITimeHighestProps, hasHighest: boolean, grid: ITimeGridProps) => {
    if (hasHighest) {
      // 如果背景显示, 则不画线
      if (grid.show) {
        return null
      }
    }

    const show = highest.show ?? true
    if (!show) return null

    return <Highest {...highest} hasHighest={hasHighest} />
  },

  /**
   * 基线
   */
  getBasic: (basic: ITimeHighestProps, hasBasic: boolean, grid: ITimeGridProps) => {
    if (hasBasic) {
      if (grid.show) {
        return null
      }
    }

    const show = basic.show ?? true
    if (!show) return null

    return <Highest {...basic} hasHighest={hasBasic} />
  },

  /**
   * 十字准线
   */
  getCross: (cross: ITimeCrossProps, crossProps: { [K: string]: any } = {}) => {
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
  },

  /**
   * 成交量柱状图
   */
  getVolumeBars: (
    props: ITimeKProps,
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
}

export { Handler, HandleCommon }
