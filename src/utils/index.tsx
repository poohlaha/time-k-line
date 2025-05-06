/**
 * @fileOverview 公共方法
 * @date 2023-08-28
 * @author poohlaha
 */
import { AxisDefaultProps, AxisTextOffset, IAxisProps, ITimeHighestProps, XOffset } from '../types/time'

const Utils = {
  /**
   * 检验字符串是否为空
   */
  isBlank: (value: string) => {
    return (
      value === undefined || value == null || /^[ ]+$/.test(value) || value.length === 0 || value.trim().length === 0
    )
  },

  /**
   * 格式化成 万 / 亿
   * @param num
   */
  formatNumberUnit: (num: number): string => {
    if (num >= 1e8) {
      return `${(num / 1e8).toFixed(2).replace(/\.00$/, '')}亿`
    } else if (num >= 1e4) {
      return `${(num / 1e4).toFixed(2).replace(/\.00$/, '')}万`
    } else {
      return num.toString()
    }
  },

  /**
   * 获取交易时间段, 拆分为每分钟
   */
  getTradingMinutes: (tradTimes: Array<string> = []) => {
    if (tradTimes.length === 0) {
      return []
    }

    // 时间转分
    const timeToMinute = (time: string) => {
      const [h, m] = time.split(':').map(Number)
      return h * 60 + m
    }

    // 获取分钟
    const getMinutes = (startMin: number, endMin: number) => {
      let minutes: Array<number> = []
      for (let m = startMin; m <= endMin; m++) {
        minutes.push(m)
      }

      return minutes
    }

    let minutes: Array<number> = []
    for (const time of tradTimes) {
      let [start, end] = ['', '']
      if (time.indexOf('~') !== -1) {
        [start, end] = time.split('~') || []
      } else if (time.indexOf('-') !== -1) {
        [start, end] = time.split('-') || []
      } else {
        [start, end] = [time, time]
      }

      const startMin = timeToMinute(start)
      const endMin = timeToMinute(end)
      minutes = minutes.concat(getMinutes(startMin, endMin))
    }

    return minutes
  },

  /**
   * 获取价格等分, 按 0.01 拆分
   */
  getTradingPrices: (yLabels: Array<string | number> = []) => {
    if (yLabels.length === 0) return []
    const numericLabels = yLabels
      .map((label: string | number) => (typeof label === 'string' ? parseFloat(label) : label))
      .filter(n => !isNaN(n)) // 过滤非法数字

    if (numericLabels.length === 0) return []
    const minPrice = Math.min(...numericLabels)
    const maxPrice = Math.max(...numericLabels)

    const range = maxPrice - minPrice
    if (range <= 0) return [minPrice]

    const count = yLabels.length
    if (count === 1 || minPrice === maxPrice) return [Number(minPrice.toFixed(4))]

    const step = (maxPrice - minPrice) / (count - 1)
    const labels: number[] = []

    for (let i = 0; i < count; i++) {
      labels.push(Number((minPrice + i * step).toFixed(4)))
    }

    return labels
  },

  /**
   * 查找时间戳在交易时间中对应的 index
   */
  getTimeIndexByMinute: (timestamp: number, tradeMinutes: number[]): number => {
    const date = new Date(timestamp)
    const totalMin = date.getHours() * 60 + date.getMinutes()
    return tradeMinutes.indexOf(totalMin) // -1 表示不在交易时间段中
  },

  /**
   * 获取 Y 轴标签
   */
  onCalculateYLabels: (
    lines: number = 0,
    props: IAxisProps,
    maxPrice: number = 0,
    minPrice: number = 0
  ): Array<number> => {
    // 不显示 y 轴
    if (lines === 0) return []

    const yLabels = props.yLabels || []
    if (yLabels.length > 0) {
      const labels = yLabels
        .map((label: string | number) =>
          typeof label === 'string' ? parseFloat(Number(label).toFixed(2)) : parseFloat(label.toFixed(2))
        )
        .filter(n => !isNaN(Number(n)))

      return labels
    }

    let labels: Array<number> = []

    // 判断有没有基线, 以基线为准
    /*
    basicData = basicData ?? 0

    if (basicData > 0) {
      // count += 1 // 需要算上 `基线`

      // 1. 如果大于 maxPrice, 则取 maxPrice
      if (basicData > maxPrice) {
        basicData = maxPrice
      }

      // 2. 如果小于 minPrice, 则取 minPrice
      if (basicData < minPrice) {
        basicData = minPrice
      }
    }
     */

    // 等分
    labels.push(parseFloat(minPrice.toFixed(2))) // 最小价格线
    const newLines = lines - 2 // 减去最小价格线和最大价格线
    if (newLines <= 0) {
      if (minPrice !== maxPrice) {
        labels.push(parseFloat(maxPrice.toFixed(2))) // 最大价格线
      }
      return labels
    }

    const equalRange = parseFloat(((maxPrice - minPrice) / (newLines + 1)).toFixed(2))
    for (let i = 1; i <= newLines; i++) {
      labels.push(parseFloat((minPrice + equalRange * i).toFixed(2)))
    }

    // 插入基线
    /*
    if (basicData > 0 && basicData > minPrice && basicData < maxPrice) {
      const index = labels.findIndex((n: number) => n > basicData)
      if (index !== -1) {
        labels.splice(index, 0, basicData)
      }
    }
     */

    labels.push(parseFloat(maxPrice.toFixed(2))) // 最大价格线
    return labels
  },

  /**
   * 计算 X 轴坐标
   */
  onCalculateXPoints: (
    width: number = 0,
    height: number = 0,
    isYLeft: boolean,
    fontSize: number = 0,
    xLabels: Array<string | number> = []
  ) => {
    let points: Array<{ [K: string]: any }> = []

    let lines = xLabels.length
    const xStep = Number((width / (lines - 1)).toFixed(2))
    const offsetY = AxisDefaultProps.lineWidthOrHeight

    for (let i = 0; i < lines; i++) {
      let x = i * xStep + XOffset // 第一个偏移, 防止交叉处出现 `伸出来`, 最后一个向左偏移
      let needLine = true
      if (isYLeft && i === 0) {
        needLine = false
      } else if (!isYLeft && i === lines - 1) {
        needLine = false
      }

      let xText = i * xStep
      let textAnchor = 'middle' // 文字默认居中
      if (i === 0) {
        textAnchor = 'start'
        xText += AxisTextOffset // 第一个文字向右偏移
      } else if (i === lines - 1) {
        textAnchor = 'end'
        xText -= AxisTextOffset // // 最后一个文字向左偏移
      }

      points.push({
        line: {
          x1: x,
          y1: height,
          x2: x,
          y2: height + offsetY
        },
        text: {
          x: xText,
          y: height + fontSize + offsetY,
          anchor: textAnchor
        },
        needLine,
        label: xLabels[i] || ''
      })
    }

    return points || []
  },

  /**
   * 计算文字长度
   */
  onMeasureTextWidth: (text: string, fontSize: number, fontFamily: string) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return 0

    context.font = `${fontSize}px ${fontFamily}`
    const metrics = context.measureText(text)
    return metrics.width
  },

  /**
   * 计算 Y 轴坐标
   */
  onCalculateYPoints: (
    width: number = 0,
    height: number = 0,
    isYLeft: boolean = false,
    fontSize: number = 0,
    fontFamily: string,
    yLabels: Array<number> = [],
    maxPrice: number,
    highest: ITimeHighestProps,
    basic: ITimeHighestProps
  ) => {
    let points: Array<{ [K: string]: any }> = []

    const yStep = height / (yLabels.length - 1)
    const offsetX = AxisDefaultProps.lineWidthOrHeight

    const textAnchor = isYLeft ? 'end' : 'start'
    const x = isYLeft ? 0 : width - AxisTextOffset

    let hasHighest = false
    let hasBasic = false

    const data = basic?.data

    for (let i = 0; i < yLabels.length; i++) {
      const y = height - i * yStep
      const label = yLabels[i]
      const textWidth = Utils.onMeasureTextWidth(`${label}`, fontSize, fontFamily)
      const textOffsetX = isYLeft ? textWidth + AxisTextOffset : -textWidth - AxisTextOffset

      // 判断是不是最高线
      let isHighest = false
      let isBasic = false

      // 最高线
      if (label === maxPrice) {
        isHighest = true
        hasHighest = true
      }

      // 基线
      if (data !== null && data !== undefined) {
        if (label === data) {
          isBasic = true
          hasBasic = true
        }
      }

      let yText = height - i * yStep - AxisTextOffset
      if (i === 0) {
        // yText -= AxisTextOffset // 第一个文字向上偏移
      } else if (i === yLabels.length - 1) {
        yText += AxisTextOffset * 2 // // 最后一个文字向下偏移
      }

      points.push({
        line: {
          x1: x,
          y1: y,
          x2: x + offsetX,
          y2: y
        },
        text: {
          x: x + textOffsetX,
          y: yText + fontSize / 2 - 2,
          anchor: textAnchor
        },
        needLine: i !== 0,
        label: `${label.toFixed(2)}`,
        highest: {
          isHighest,
          ...highest
        },
        basic: {
          isBasic,
          ...basic
        }
      })
    }

    return { yPoints: points || [], hasHighest, hasBasic }
  }
}

export default Utils
