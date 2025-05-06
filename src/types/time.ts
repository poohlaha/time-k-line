/**
 * @fileOverview 输出性情
 * @date 2025-04-24
 * @author poohlaha
 */
// 定义分时图属性
import { ITooltipProps } from '@pages/time-k-line/types/component'

/**
 * data
 * [
 *   时间戳, // 例如 1745459460000
 *   当前价格, // 例如 8.16
 *   数值A, // 25047000（成交量）
 *   数值B  // 206046740（成交额）
 * ]
 */
export interface ITimeProps {
  type?: 'canvas' | 'svg' // default svg
  width: number // 长度
  height: number // 宽度
  grid?: IGridProps // 网格背景
  axis: IAxisProps // 坐标轴
  data: Array<Array<number>> // 数据
  riseColor?: string // 涨颜色
  fallColor?: string // 跌颜色
  closingPrice: number // 昨日收盘价
  highest?: IHighestProps // 最高线
  fontSize?: number // 字体大小
  fontFamily?: string
  cross?: ICrossProps // 十字准线
  tradeTimes?: Array<string> // 交易时间段, 如要更改, 请同时更改 xLabels 的值
  basic?: IBasicProps // 基线
  tooltip?: ITooltipProps
  volume?: IVolumeProps
}

export const TimeDefaultProps = {
  riseColor: '#f44336',
  fallColor: '#037B66',
  defaultColor: '#6b89f2'
}

export type LineType = 'solid' | 'dashed'

// 早上 120 分钟, 下午 120 分钟, 共计 240 分钟
export const TRADE_TIMES = ['9:30~11:30', '13:00~15:00']

export const DEFAULT_FONT_SIZE = 12 // 默认字体大小
export const DEFAULT_FONT_FAMILY = 'Arial' // 默认字体

// 成交量柱状图
export interface IVolumeProps {
  show?: boolean
  textColor?: string // 文字颜色
  height?: number
}

export interface ITimeVolumeProps extends IVolumeProps {
  x: number
  y: number
  width: number
  height: number
  color: string
}

// 默认的成交量柱状图
export const VolumeDefaultProps = {
  show: true,
  textColor: '#3D404D',
  height: 30
}

// 网格背景属性
export interface IGridProps {
  show?: boolean
  color?: string // 颜色
  lineType?: LineType // 线条类型, 默认为 dashed
  verticalLines?: number // 纵向线条数
}

export interface ITimeGridProps extends IGridProps {
  width: number // 长度
  height: number // 宽度
  horizontalLines: number
  isYLeft: boolean
  xPoints: Array<{ [K: string]: any }>
  yPoints: Array<{ [K: string]: any }>
}

// 默认的网格背景属性
export const GridDefaultProps = {
  color: 'rgba(186, 186, 186, 0.2)',
  lineType: 'dashed',
  horizontalLines: 4,
  verticalLines: 3
}

// x 轴 和 y 轴
export interface IAxisProps {
  lineColor?: string // 颜色
  textColor?: string // 文字颜色
  xLabels?: Array<string> // x 轴
  yLabels?: Array<string | number> // y 轴
  yPosition?: 'left' | 'right'
  fontSize?: number
  padding?: number
  fontFamily?: string
  needXLine?: boolean
  needYLine?: boolean
}

export interface ITimeAxisProps extends IAxisProps {
  width: number // 长度
  height: number // 宽度
  maxPrice: number
  minPrice: number
  isYLeft: boolean
  totalWidth: number
  totalHeight: number
  xPoints: Array<{ [K: string]: any }>
  yPoints: Array<{ [K: string]: any }>
}

// 默认 x 轴 和 y 轴 属性
export const AxisDefaultProps = {
  lineColor: '#e0e0e0',
  textColor: '#bdc0c0',
  xLabels: ['09:30', '11:30/13:00', '15:00'],
  yPosition: 'left',
  padding: 30,
  needXLine: true,
  needYLine: false,
  lineWidthOrHeight: 5
}

// 价格最高线
export interface IHighestProps {
  show?: boolean
  lineColor?: string
  textColor?: string
  lineType?: LineType
}

// 基线属性
export interface IBasicProps extends IHighestProps {
  show?: boolean
  data: number
  lineColor?: string
  textColor?: string
  lineType?: LineType
}

export interface ITimeHighestProps extends IHighestProps {
  width: number
  height: number
  price: number
  fontSize: number
  fontFamily: string
  isAxisLeft: boolean
  y: number
}

// 默认价格最高线属性
export const HighestDefaultProps = {
  show: true,
  lineColor: '#333333',
  textColor: '#666666',
  lineType: 'dashed'
}

// 十字准线
export interface ICrossProps {
  show?: boolean
  color?: string
  lineType?: LineType
}

export interface ITimeCrossProps extends ICrossProps {
  x: number
  y: number
  width: number
  height: number
}

// 十字准线默认属性
export const DefaultCrossProps = {
  color: '#e0e0e0',
  lineType: 'dashed'
}

export const XOffset: number = 0 // x 轴偏移量, 第一个元素需要向右偏移, 最后一个元素需要向左偏移
export const AxisTextOffset: number = 8 // 文字偏移量, x 轴和 y 轴第一个和最后一个元素需要偏移
