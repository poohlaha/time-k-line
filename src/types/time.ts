/**
 * @fileOverview 分时图输出属性
 * @date 2025-04-24
 * @author poohlaha
 */
// 定义分时图属性
import { ITimeKProps } from './component'

/**
 * data
 * [
 *   时间戳, // 例如 1745459460000
 *   当前价格, // 例如 8.16
 *   数值A, // 25047000（成交量）
 *   数值B  // 206046740（成交额）
 * ]
 */
export interface ITimeProps extends ITimeKProps {
  closingPrice?: number // 昨日收盘价
  tradeTimes?: Array<string> // 交易时间段, 如要更改, 请同时更改 xLabels 的值
}

// 早上 120 分钟, 下午 120 分钟, 共计 240 分钟
export const TRADE_TIMES = ['9:30~11:30', '13:00~15:00']
