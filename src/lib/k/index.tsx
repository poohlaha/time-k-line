/**
 * @fileOverview K 线图
 * @date 2023-08-28
 * @author poohlaha
 */
import React, { ReactElement, useRef, useState } from 'react'
import { IKProps } from '../../types/k'
import { Handler, HandleCommon } from '../../utils/handler'
import Utils from '../../utils'
import dayjs from 'dayjs'
import { GridDefaultProps, TimeKDefaultProps } from '../../types/default'
import { IKDataItemProps, IShareTooltipProps, IVolumeDataItemProps } from '../../types/share'
import Tooltip from '../../components/tooltip'

const KLine: React.FC<IKProps> = (props: IKProps): ReactElement => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltipProps, setTooltipProps] = useState({ show: false, x: 0, y: 0, data: [] })
  const [crossProps, setCrossProps] = useState({ show: false, x: 0, y: 0, index: 0, yLeftLabel: '', yRightLabel: '' })

  /**
   * 获取价格最小值和最大值
   */
  const getPriceRange = () => {
    // 网格背景
    const grid = Handler.getGridProps(props)
    const verticalLines = grid.verticalLines ?? GridDefaultProps.verticalLines

    const data: Array<IKDataItemProps> = props.data || []
    let minPrice = 0
    let maxPrice = 0
    let volumes: Array<IVolumeDataItemProps> = []
    let tradeMinutes: Array<number> = []

    let xLabels: Array<string> = []
    if (data.length > 0) {
      let prices: Array<number> = []
      data.forEach(d => {
        prices.push(d.high ?? 0)
        prices.push(d.low ?? 0)
        volumes.push({
          timestamp: d.timestamp ?? 0,
          price: d.open ?? 0,
          volume: d.volume ?? 0,
          turnover: d.turnover ?? 0
        } as IVolumeDataItemProps)

        tradeMinutes.push(d.timestamp)
      })

      minPrice = Math.min(...prices)
      maxPrice = Math.max(...prices)

      // 获取 x 坐标轴
      if (verticalLines > 0) {
        const labels: { label: string; index: number }[] = []
        const step = Math.floor(data.length / verticalLines)
        for (let i = 0; i < data.length; i += step) {
          const timestamp = data[i].timestamp ?? 0
          const label = dayjs(timestamp).format('YYYY-MM-DD')
          labels.push({ label, index: i })
          xLabels.push(label)
        }

        // 保证最后一个也被加进去
        if (labels[labels.length - 1]?.index !== data.length - 1) {
          const last = data[data.length - 1]
          xLabels.push(dayjs(last.timestamp ?? 0).format('YYYY-MM-DD'))
        }
      }
    }

    return { minPrice, maxPrice, volumes, data, xLabels, tradeMinutes }
  }

  /**
   * 计算 X 轴, Y 轴坐标点
   */
  const onCalculateXYPoints = () => {
    const { maxPrice, minPrice, volumes, data, xLabels, tradeMinutes } = getPriceRange()
    const commonProps = Handler.getKTimeProps(props, xLabels, props.closingPrice ?? 0, maxPrice, minPrice)

    return {
      maxPrice,
      minPrice,
      volumes,
      data,
      tradeMinutes,
      ...commonProps,
      cross: {
        ...(commonProps.cross || {}),
        yAmplitudes: []
      }
    }
  }

  /**
   * 获取 tooltip 数据
   */
  const getTooltipData = (
    data: IKDataItemProps,
    riseColor: string = '',
    fallColor: string = '',
    flatColor: string = ''
  ) => {
    let tooltipData: any = []

    const closingPrice = props.closingPrice ?? 0
    const timestamp = data.timestamp ?? 0
    const open = data.open ?? 0
    const high = data.high ?? 0
    const low = data.low ?? 0
    const close = data.close ?? 0
    const volume = data.volume ?? 0
    const turnover = data.turnover ?? 0

    tooltipData.push({
      label: '时间',
      value: dayjs(timestamp).format('MM-DD HH:mm')
    })

    tooltipData.push({
      label: '开盘',
      value: Utils.formatNumberUnit(parseFloat(open.toFixed(2)))
    })

    tooltipData.push({
      label: '收盘',
      value: Utils.formatNumberUnit(parseFloat(close.toFixed(2)))
    })

    tooltipData.push({
      label: '最高',
      value: Utils.formatNumberUnit(parseFloat(high.toFixed(2)))
    })

    tooltipData.push({
      label: '最低',
      value: Utils.formatNumberUnit(parseFloat(low.toFixed(2)))
    })

    // 计算涨跌额 | 涨跌幅
    if (closingPrice > 0) {
      // 涨跌额 = 收盘价 - 开盘价
      const curPrice = close - open
      // 涨跌幅 = (涨跌额 / 开盘价) × 100%
      const { riseAndFall, amplitude } = Utils.onCalculateRiseAndFall(close, open)
      tooltipData.push({
        label: '涨跌额',
        value: `${curPrice > 0 ? '+' : ''}${curPrice.toFixed(2)}`,
        color: curPrice > 0 ? riseColor : curPrice === 0 ? flatColor : fallColor
      })

      tooltipData.push({
        label: '涨跌幅',
        value: amplitude,
        color: riseAndFall > 0 ? riseColor : curPrice === 0 ? flatColor : fallColor
      })
    }

    tooltipData.push({
      label: '成交量',
      value: Utils.formatNumberUnit(parseFloat(volume.toFixed(2)))
    })

    tooltipData.push({
      label: '成交额',
      value: Utils.formatNumberUnit(parseFloat(turnover.toFixed(2)))
    })

    const floatShares = data.floatShare ?? 0
    if (floatShares > 0) {
      // 换手率 = 成交量 / 流通股本 × 100%
      const value = (volume / floatShares) * 100
      tooltipData.push({
        label: '换手率',
        value: `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
      })
    }

    return tooltipData
  }

  const onMouseMove = (
    e: React.MouseEvent<SVGSVGElement>,
    tooltip: IShareTooltipProps,
    yLabels: Array<number>,
    height: number,
    riseColor: string = '',
    fallColor: string = '',
    flatColor: string = '',
    candleWidth: number,
    unitWidth: number,
    data: Array<IKDataItemProps> = []
  ) => {
    if (!svgRef.current || data.length === 0) return

    const svgRect = svgRef.current.getBoundingClientRect()
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - svgRect.left

    // 计算落在哪个蜡烛图上
    const index = Math.floor(mouseX / unitWidth)
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1))

    // 获取这个蜡烛图的中心 X 坐标
    const centerX = clampedIndex * unitWidth + candleWidth / 2
    const yPoint = Utils.getPriceByYPosition(e.clientY - rect.top, yLabels, height)
    const yLeftLabel = yPoint === null ? '' : `${yPoint.toFixed(2)}`
    setCrossProps({
      show: true,
      x: centerX,
      y: e.clientY - rect.top,
      index,
      yLeftLabel,
      yRightLabel: yLeftLabel
    })

    if (index < 0 || index >= data.length) {
      // setTooltipProps({ show: false, x: 0, y: 0, data: [] })
      return
    }

    const item = data[index]
    const tooltipData = getTooltipData(item, riseColor, fallColor, flatColor)
    if (tooltip.show) {
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
  }

  /**
   * 计算蜡烛图属性
   */
  const onCalculateCandleProps = (commonProps: { [K: string]: any } = {}) => {
    // 计算蜡烛宽度, 保留 80% 显示蜡烛，40% 留作间距
    const unitWidth = props.width / commonProps.data.length // 每个蜡烛等分宽度
    const candleWidth = unitWidth * 0.8
    const padding = (commonProps.maxPrice - commonProps.minPrice) * 0.05
    const adjustedMax = commonProps.maxPrice + padding
    const adjustedMin = commonProps.minPrice - padding
    const priceRange = adjustedMax - adjustedMin

    const pixelPerPrice = commonProps.height / priceRange
    const scaleY = (price: number) => (adjustedMax - price) * pixelPerPrice
    return { unitWidth, candleWidth, scaleY }
  }

  /**
   *  K 线图
   */
  const getKLine = (
    commonProps: { [K: string]: any } = {},
    unitWidth: number,
    candleWidth: number,
    scaleY: Function
  ) => {
    const { data, riseColor, fallColor } = commonProps
    if (data.length === 0) return null

    const flatColor = Utils.isBlank(props.flatColor || '') ? TimeKDefaultProps.flatColor : props.flatColor || ''

    return (
      <svg width={props.width} height={props.height}>
        {data.map((item: IKDataItemProps, index: number) => {
          const x = index * unitWidth + (unitWidth - candleWidth) / 2
          const open = item.open ?? 0
          const close = item.close ?? 0
          const yOpen = scaleY(open)
          const yHigh = scaleY(item.high ?? 0)
          const yLow = scaleY(item.low ?? 0)
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
            <g key={item.timestamp}>
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

  const getTooltip = (tooltip: IShareTooltipProps, prefixClassName: string = '') => {
    if (!tooltip.show || !tooltipProps.show) return null

    let className = tooltip.className || ''
    className += ' k-chart-tooltip'
    return (
      <Tooltip
        {...tooltip}
        x={tooltipProps.x ?? 0}
        y={tooltipProps.y ?? 0}
        data={tooltipProps.data || []}
        show={tooltipProps.show}
        prefixClassName={prefixClassName || ''}
        className={className}
      />
    )
  }

  const render = () => {
    const commonProps = onCalculateXYPoints()
    const { unitWidth, candleWidth, scaleY } = onCalculateCandleProps(commonProps)
    return (
      <div
        className={`${commonProps.prefixClassName || ''}-k-chart flex-center wh100 relative ${props.className || ''}`}
        style={{
          width: props.width,
          height: props.height
        }}
      >
        <svg
          className="z-10 absolute"
          width={props.width}
          height={props.height}
          ref={svgRef}
          onMouseMove={e => {
            e.preventDefault()
            onMouseMove(
              e,
              commonProps.tooltip,
              commonProps.yLabels,
              commonProps.height,
              commonProps.riseColor,
              commonProps.fallColor,
              commonProps.flatColor,
              candleWidth,
              unitWidth,
              commonProps.data
            )
          }}
          onMouseLeave={onMouseLeave}
        >
          {HandleCommon.getCommon(
            props,
            commonProps.prefixClassName,
            commonProps.width,
            commonProps.height,
            commonProps.grid,
            commonProps.axis,
            commonProps.highest,
            commonProps.basic,
            commonProps.cross,
            commonProps.volume,
            commonProps.volumes,
            commonProps.xPoints,
            commonProps.yPoints,
            [],
            commonProps.tradeMinutes,
            crossProps,
            commonProps.fontSize,
            commonProps.fontFamily,
            commonProps.hasHighest,
            commonProps.hasBasic
          )}
        </svg>
        {/* 背景网格 | 坐标轴 ｜ 最高线 | 基线 | 十字准线 | 成交量柱状图 */}
        <svg className="z-1 absolute" width={props.width} height={props.height}>
          {/* K 线图 */}
          {getKLine(commonProps, unitWidth, candleWidth, scaleY)}
        </svg>

        {/* ToolTip */}
        {getTooltip(commonProps.tooltip, commonProps.prefixClassName || '')}
      </div>
    )
  }

  return render()
}

export default KLine
