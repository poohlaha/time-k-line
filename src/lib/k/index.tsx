/**
 * @fileOverview K 线图
 * @date 2023-08-28
 * @author poohlaha
 */
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { IKProps } from '../../types/k'
import { Handler, HandleCommon } from '../../utils/handler'
import Utils from '../../utils'
import dayjs from 'dayjs'
import {
  DefaultMAProps,
  GridDefaultProps,
  HighestDefaultProps,
  HighLowDefaultProps,
  TimeKDefaultProps
} from '../../types/default'
import {
  IKDataItemProps,
  IKMAProps,
  IShareLineKHighLowProps,
  IShareTooltipProps,
  IVolumeDataItemProps
} from '../../types/share'
import Tooltip from '../../components/tooltip'

const KLine: React.FC<IKProps> = (props: IKProps): ReactElement => {
  const svgRef = useRef<SVGSVGElement>(null)
  const maRef = useRef<HTMLDivElement>(null)

  const [size, setSize] = useState<{ [K: string]: any }>({ width: 0, height: 0, maHeight: 0 })
  const [tooltipProps, setTooltipProps] = useState({ show: false, x: 0, y: 0, data: [] })
  const [crossProps, setCrossProps] = useState({ show: false, x: 0, y: 0, index: 0, yLeftLabel: '', yRightLabel: '' })
  const [ma, setMa] = useState({ ma5: '0.00', ma10: '0.00', ma20: '0.00' })

  const [startIndex, setStartIndex] = useState(0)
  const [endIndex, setEndIndex] = useState(0)
  const wheelDeltaRef = useRef<{ deltaX: number; deltaY: number } | null>(null)
  const tickingRef = useRef(false)

  useEffect(() => {
    const current = maRef.current
    if (!current) return
    const rect = current.getBoundingClientRect()
    const height = props.height - rect.height
    setSize({ width: props.width ?? 0, height: height < 0 ? 0 : height, maHeight: rect.height })
  }, [maRef])

  useEffect(() => {
    const data = props.data || []
    if (data.length === 0) {
      setMa({ ma5: '0.00', ma10: '0.00', ma20: '0.00' })
      return
    }

    const ma5 = onCalculateMa(data, data.length - 1, 5) // 计算5日均线
    const ma10 = onCalculateMa(data, data.length - 1, 10) // 计算10日均线
    const ma20 = onCalculateMa(data, data.length - 1, 20) // 计算20日均线
    setMa({ ma5, ma10, ma20 })
    setStartIndex(0)
    setEndIndex(data.length)
  }, [props.data || []])

  useEffect(() => {
    if (startIndex < 10) {
      console.log('fetch more data ...')
      props.onGetMoreData?.()
    }
  }, [startIndex])

  /**
   * 滚轴滚动事件
   * 缩小（deltaY > 0）：视图向左平移，从右边挤出更多K线(startIndex 左移，visibleCount 增大)
   * 放大（deltaY < 0）：视图向右平移，从右边“收缩”数据，只显示更少的K线(startIndex 右移，visibleCount 减小)
   * 不考虑鼠标位置，鼠标只触发行为，不作为缩放锚点
   *
   * macOS触控板:
   * 双指同时向左/右滑 ➜ 触发的是 wheel 事件中的 deltaX
   * 双指同时向上/下滑 ➜ 触发的是 deltaY。
   * 两个手指一边一个方向滑（比如左手指向左，右手指向右） ➜ macOS 会理解为“缩放手势（pinch）”
   *
   * 双指左右滑动 | Math.abs(deltaX) > deltaY | 平移
   * 双指上下滑动 | Math.abs(deltaY) > deltaX | 缩放
   * 双指外扩（Trackpad 缩放） | ctrlKey === true | 缩放（更敏感）
   */
  const onHandleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    // 隐藏十字准线和tooltip
    onMouseLeave()

    if (!wheelDeltaRef.current) {
      wheelDeltaRef.current = { deltaX: e.deltaX, deltaY: e.deltaY }
    } else {
      wheelDeltaRef.current.deltaX += e.deltaX
      wheelDeltaRef.current.deltaY += e.deltaY
    }

    if (!tickingRef.current) {
      tickingRef.current = true
      requestAnimationFrame(() => {
        const deltas = wheelDeltaRef.current
        if (deltas) {
          onProcessWheel(deltas.deltaX, deltas.deltaY)
          wheelDeltaRef.current = null
        }
        tickingRef.current = false
      })
    }
  }

  const onProcessWheel = (deltaX: number, deltaY: number) => {
    const visibleCount = endIndex - startIndex
    const zoomStep = 0.2
    const minCount = 25
    const maxCount = props.data.length

    // 判断操作类型：主方向为 X 是平移，主方向为 Y 是缩放
    const isPan = Math.abs(deltaX) > Math.abs(deltaY)

    if (isPan) {
      // 左右滑动平移
      const currentCount = endIndex - startIndex
      const isMac = /Mac/.test(navigator.platform)
      const zoomIn = isMac ? deltaX < 0 : deltaY < 0
      const newCount = zoomIn
        ? Math.max(minCount, currentCount - zoomStep)
        : Math.min(maxCount, currentCount + zoomStep)

      const newStart = Math.max(0, endIndex - newCount)

      setStartIndex(newStart)
      setEndIndex(endIndex)
    } else {
      // 📏 上下滑动缩放：从右向左（放大），左向右（缩小）
      const zoomIn = deltaY < 0 // 向上/外扩 = 放大
      let newVisibleCount = zoomIn
        ? Math.max(25, visibleCount - zoomStep)
        : Math.min(props.data.length, visibleCount + zoomStep)

      // 🔒 固定 endIndex（右边对齐）
      let newStart = Math.max(0, endIndex - newVisibleCount)
      let newEnd = endIndex

      setStartIndex(newStart)
      setEndIndex(newEnd)
    }
  }

  /**
   * 获取价格最小值和最大值
   */
  const getPriceRange = (data: Array<IKDataItemProps> = []) => {
    // 网格背景
    const grid = Handler.getGridProps(props)
    const verticalLines = grid.verticalLines ?? GridDefaultProps.verticalLines

    let minPrice = 0
    let maxPrice = 0
    let high: number = 0
    let highIndex: number = -1
    let low: number = 0
    let lowIndex: number = -1
    let volumes: Array<IVolumeDataItemProps> = []
    let tradeMinutes: Array<number> = []

    let xLabels: Array<string> = []
    if (data.length > 0) {
      let highPrices: Array<number> = []
      let lowPrices: Array<number> = []
      data.forEach(d => {
        highPrices.push(d.high ?? 0)
        lowPrices.push(d.low ?? 0)
        volumes.push({
          timestamp: d.timestamp ?? 0,
          price: d.open ?? 0,
          volume: d.volume ?? 0,
          turnover: d.turnover ?? 0
        } as IVolumeDataItemProps)

        tradeMinutes.push(d.timestamp)
      })

      high = Math.max(...highPrices)
      highIndex = highPrices.indexOf(high)
      low = Math.min(...lowPrices)
      lowIndex = lowPrices.indexOf(low)

      const prices = highPrices.concat(lowPrices)
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

    return { minPrice, maxPrice, volumes, xLabels, tradeMinutes, high, highIndex, low, lowIndex }
  }

  /**
   * 计算 X 轴, Y 轴坐标点
   */
  const onCalculateXYPoints = (data: Array<IKDataItemProps> = []) => {
    const { maxPrice, minPrice, volumes, xLabels, tradeMinutes, high, highIndex, low, lowIndex } = getPriceRange(
      data || []
    )
    const commonProps = Handler.getKTimeProps(
      {
        ...(props || {}),
        width: size.width,
        height: size.height
      },
      xLabels,
      props.closingPrice ?? 0,
      maxPrice,
      minPrice,
      false,
      false
    )

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
      },
      high,
      highIndex,
      low,
      lowIndex
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

    // 计算对应 index 的 MA 值
    const ma5 = onCalculateMa(data, clampedIndex, 5)
    const ma10 = onCalculateMa(data, clampedIndex, 10)
    const ma20 = onCalculateMa(data, clampedIndex, 20)
    setMa({ ma5, ma10, ma20 })

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
   * 获取均线属性
   */
  const getMaProps = () => {
    const ma = props.ma || {}
    const className = ma.className || ''
    const five = ma.five || {}
    const ten = ma.ten || {}
    const twenty = ma.twenty || {}

    const fontClassName = Utils.isBlank(ma.fontClassName || '') ? DefaultMAProps.fontClassName : ma.fontClassName || ''
    const fiveClassName = five.className || ''
    const fiveColor = Utils.isBlank(five.color || '') ? DefaultMAProps.fiveColor : five.color || ''

    const tenClassName = ten.className || ''
    const tenColor = Utils.isBlank(ten.color || '') ? DefaultMAProps.tenColor : ten.color || ''

    const twentyClassName = twenty.className || ''
    const twentyColor = Utils.isBlank(twenty.color || '') ? DefaultMAProps.twentyColor : twenty.color || ''

    return {
      fontClassName,
      className,
      five: {
        className: fiveClassName,
        color: fiveColor
      },
      ten: {
        className: tenClassName,
        color: tenColor
      },
      twenty: {
        className: twentyClassName,
        color: twentyColor
      }
    } as IKMAProps
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
      <svg width={size.width} height={size.height}>
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

  /**
   * 绘制最高线和最低线
   */
  const getHighLowLine = (
    commonProps: { [K: string]: any } = {},
    prop: IShareLineKHighLowProps | undefined = {},
    highLow: number = 0,
    highLowIndex: number = -1,
    unitWidth: number = 0,
    candleWidth: number = 0,
    scaleY: Function,
    width: number,
    height: number,
    top: number = 0
  ) => {
    if (highLow === 0) {
      return null
    }

    if (highLowIndex === -1) {
      return null
    }

    const y = scaleY(highLow)
    const x = highLowIndex * unitWidth + candleWidth / 2

    // 计算文字大小
    const highestSize = Utils.onMeasureTextSize(`${highLow.toFixed(2)}`, commonProps.fontSize, commonProps.fontFamily)

    const margin = 5
    const lineColor = Utils.isBlank(prop.lineColor || '') ? HighestDefaultProps.lineColor : prop.lineColor || ''
    const textColor = Utils.isBlank(prop.textColor || '') ? HighestDefaultProps.textColor : prop.textColor || ''
    const circleColor = Utils.isBlank(prop.circleColor || '') ? HighLowDefaultProps.circleColor : prop.circleColor || ''
    const lineType = Utils.isBlank(prop.lineType || '') ? HighLowDefaultProps.lineType : prop.lineType || ''
    const lineWidth = prop.lineWidth ?? HighLowDefaultProps.lineWidth

    let drawLeft = false
    if (props.width - x < lineWidth + highestSize.width + margin) {
      drawLeft = true
    }

    const strokeDasharray = lineType === 'dashed' ? '4 2' : 'none'
    const lineStartX = drawLeft ? x - lineWidth + 1 : x
    const lineEndX = drawLeft ? x + 1 : x + lineWidth
    const textX = drawLeft
      ? lineStartX - highestSize.width / 2 - margin / 2
      : lineEndX + highestSize.width / 2 + margin / 2
    const circleX = drawLeft ? lineStartX : lineEndX
    return (
      <svg
        className={`${commonProps.prefixClassName || ''}-highest z-1 absolute`}
        width={width}
        height={height}
        style={{ top }}
      >
        {/* 横线从蜡烛图中心 maxX 开始延伸到图右边 */}
        <line
          x1={lineStartX}
          y1={y}
          x2={lineEndX} // 整个图宽度
          y2={y}
          stroke={lineColor}
          strokeWidth={1}
          strokeDasharray={strokeDasharray}
        />

        {/* 画圆点 */}
        <circle
          className={`${commonProps.prefixClassName || ''}-highest-circle`}
          cx={circleX}
          cy={y}
          r={2} // 圆点半径
          fill={circleColor} // 高亮颜色
          strokeWidth={1}
        />

        {/* 标注文字 */}
        <text x={textX} y={y + 4} fontSize={commonProps.fontSize} fill={textColor} textAnchor="middle">
          {highLow.toFixed(2)}
        </text>
      </svg>
    )
  }

  /**
   * 获取 tooltip
   */
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

  /**
   * 计算均线
   * 均线（MA，Moving Average）通常显示为一条线，但它本质是对收盘价的滑动平均。你看到三个数，可能是因为它们分别对应不同周期的均线，比如：
   * MA5：5日均线
   * MA10：10日均线
   * MA20：20日均线
   * 这三个数就是对应当天(或当前蜡烛) 计算出来的这三条均线的当前值
   * MA5 = 当前这根 + 前4根收盘价的平均
   * MA10 = 当前这根 + 前9根收盘价的平均
   * MA20 = 当前这根 + 前19根收盘价的平均
   */
  const onCalculateMa = (data: Array<IKDataItemProps>, index: number, period: number) => {
    if (index < period - 1) {
      return '0.00'
    }

    // 如果数据不足一个周期，无法计算均线
    if (data.length < period) {
      return '0.00'
    }

    // 取最后 period 个数据，计算收盘价的平均值
    const recentData = data.slice(index - period + 1)
    const sum = recentData.reduce((acc, item) => acc + item.close, 0)
    return (sum / period).toFixed(2)
  }

  /**
   * 获取均线
   */
  const getMa = (commonProps: { [K: string]: any } = {}) => {
    const maProps = getMaProps()
    return (
      <div
        className={`${commonProps.prefixClassName || ''}-k-ma flex pt-1.5 pb-1.5 pl-2 pr-2 relative ${maProps.className || ''} ${maProps.fontClassName || ''}`}
        ref={maRef}
      >
        <p className={`${commonProps.prefixClassName || ''}-k-ma-title mr-2`}>均线</p>
        <div className={`${commonProps.prefixClassName || ''}-k-ma-content flex-1 flex`}>
          <div
            className={`${commonProps.prefixClassName || ''}-k-ma-five flex ${maProps.five?.className || ''}`}
            style={{
              color: maProps.five?.color || ''
            }}
          >
            <p>MA5</p>
            <p className="ml-1 ma5">{ma.ma5}</p>
          </div>
          <div
            className={`${commonProps.prefixClassName || ''}-k-ma-ten flex ml-2 ${maProps.ten?.className || ''}`}
            style={{
              color: maProps.ten?.color || ''
            }}
          >
            <p>MA10</p>
            <p className="ml-1 ma10">{ma.ma10}</p>
          </div>
          <div
            className={`${commonProps.prefixClassName || ''}-k-ma-twenty flex ml-2 ${maProps.twenty?.className || ''}`}
            style={{
              color: maProps.twenty?.color || ''
            }}
          >
            <p>MA20</p>
            <p className="ml-1 ma20">{ma.ma20}</p>
          </div>
        </div>
      </div>
    )
  }

  const render = () => {
    const visibleData = (props.data || []).slice(startIndex, endIndex)
    const commonProps = onCalculateXYPoints(visibleData)
    const { unitWidth, candleWidth, scaleY } = onCalculateCandleProps(commonProps)
    let height = size.height - commonProps.axisPadding - (commonProps.volume.show ? commonProps.volume.height || 0 : 0)
    if (height < 0) {
      height = 0
    }

    return (
      <div
        className={`${commonProps.prefixClassName || ''}-k-chart items-center justify-center wh100 relative ${props.className || ''}`}
        style={{
          width: props.width,
          height: props.height
        }}
      >
        {/* 均线 */}
        {getMa(commonProps)}

        {/* 背景网格 | 坐标轴 ｜ 最高线 | 基线 | 十字准线 | 成交量柱状图 */}
        <svg
          className="z-10 absolute"
          width={size.width}
          height={size.height}
          ref={svgRef}
          onWheel={onHandleWheel}
          onMouseMove={e => {
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
            {
              ...(props || {}),
              width: size.width,
              height: size.height
            },
            commonProps.prefixClassName,
            size.width,
            height,
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
            commonProps.hasBasic,
            false
          )}
        </svg>

        {/* K 线图 */}
        {getKLine(commonProps, unitWidth, candleWidth, scaleY)}

        {/* 蜡烛图上的最高线 */}
        {getHighLowLine(
          commonProps,
          props.high,
          commonProps.high,
          commonProps.highIndex,
          unitWidth,
          candleWidth,
          scaleY,
          size.width,
          height,
          size.maHeight ?? 0
        )}

        {/* 蜡烛图上的最低线 */}
        {getHighLowLine(
          commonProps,
          props.low,
          commonProps.low,
          commonProps.lowIndex,
          unitWidth,
          candleWidth,
          scaleY,
          size.width,
          height,
          size.maHeight ?? 0
        )}

        {/* ToolTip */}
        {getTooltip(commonProps.tooltip, commonProps.prefixClassName || '')}
      </div>
    )
  }

  return render()
}

export default KLine
