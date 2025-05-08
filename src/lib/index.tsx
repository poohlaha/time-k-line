/**
 * @fileOverview 分时图和 K 线图整合
 * @date 2025-05-08
 * @author poohlaha
 */
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { IShareLineKProps, IShareLineProps, IShareLineTimeProps, IShareTabsProps, ITimeKProps } from '../types/share'
import { DefaultShareLineProps, TimeKDefaultProps } from '../types/default'
import Utils from '../utils'
import { Handler } from '../utils/handler'
import TimeLine from './time'
import KLine from './k'
import { ITimeProps } from '../types/time'
import { IKProps } from '../types/k'

const ShareLine: React.FC<IShareLineProps> = (props: IShareLineProps): ReactElement => {
  const [tabActiveItem, setTabActiveItem] = useState<{ [K: string]: any }>({ key: '', label: '' })
  const [_, setSize] = useState<{ [K: string]: any }>({ width: 0, height: 0 })
  const [timeKSize, setTimeKSize] = useState<{ [K: string]: any }>({ width: 0, height: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)

  const TabKeys: Array<string> = ['time', 'dailyK', 'weekK', 'monthK']

  useEffect(() => {
    const current = ref.current
    const tabCurrent = tabsRef.current
    if (!current || !tabCurrent) return
    const rect = current.getBoundingClientRect()
    const tabRect = tabCurrent.getBoundingClientRect()
    const height = rect.height - tabRect.height
    setSize({ width: rect.width ?? 0, height: rect.height })
    setTimeKSize({ width: rect.width ?? 0, height: height < 0 ? 0 : height })
  }, [ref, tabsRef])

  useEffect(() => {
    const commonProps = getCommonProps()
    const labels = getTabsLabels(commonProps) || []
    if (labels.length === 0) {
      return
    }

    let activeIndex = props.tabs?.activeIndex ?? 0
    let item: { [K: string]: any }

    if (activeIndex > labels.length - 1) {
      item = labels[0] || {}
    } else {
      item = labels[activeIndex] || {}
    }

    setTabActiveItem({ key: item.key || '', label: item.label || '' })
  }, [props.tabs?.activeIndex ?? 0])

  /**
   * 获取 分时图 属性
   */
  const getTimeProps = () => {
    const time = props.time
    if (time === undefined) {
      return null
    }

    const title = Utils.isBlank(time.title || '') ? DefaultShareLineProps.timeTitle : time.title || ''
    const data = time.data || []
    const tradeTimes = time.tradeTimes || []
    return {
      title,
      data,
      tradeTimes
    } as IShareLineTimeProps
  }

  /**
   * 获取 日K 图 属性
   */
  const getDailyKProps = () => {
    const dailyK = props.dailyK
    if (dailyK === undefined) {
      return null
    }

    const title = Utils.isBlank(dailyK.title || '') ? DefaultShareLineProps.dailyTitle : dailyK.title || ''
    const data = dailyK.data || []
    return {
      title,
      data
    } as IShareLineKProps
  }

  /**
   * 获取 周K 图 属性
   */
  const getWeekKProps = () => {
    const weekK = props.weekK
    if (weekK === undefined) {
      return null
    }

    const title = Utils.isBlank(weekK.title || '') ? DefaultShareLineProps.weekTitle : weekK.title || ''
    const data = weekK.data || []
    return {
      title,
      data
    } as IShareLineKProps
  }

  /**
   * 获取 月K 图 属性
   */
  const getMonthKProps = () => {
    const monthK = props.monthK
    if (monthK === undefined) {
      return null
    }

    const title = Utils.isBlank(monthK.title || '') ? DefaultShareLineProps.monthTitle : monthK.title || ''
    const data = monthK.data || []
    return {
      title,
      data
    } as IShareLineKProps
  }

  /**
   * 获取 tabs 属性
   */
  const getTabsProps = () => {
    const tabs = props.tabs || {}
    const activeIndex = tabs.activeIndex ?? 0
    const className = Utils.isBlank(tabs.className || '') ? DefaultShareLineProps.tab.className : tabs.className || ''
    const activeClassName = Utils.isBlank(tabs.activeClassName || '')
      ? DefaultShareLineProps.tab.activeClassName
      : tabs.activeClassName || ''
    const textColor = Utils.isBlank(tabs.textColor || '') ? DefaultShareLineProps.tab.textColor : tabs.textColor || ''
    const activeTextColor = Utils.isBlank(tabs.activeTextColor || '')
      ? DefaultShareLineProps.tab.activeTextColor
      : tabs.activeTextColor || ''
    const fontClassName = Utils.isBlank(tabs.fontClassName || '')
      ? DefaultShareLineProps.tab.fontClassName
      : tabs.fontClassName || ''
    return {
      activeIndex,
      className,
      activeClassName,
      textColor,
      activeTextColor,
      fontClassName,
      onTabClick: tabs.onTabClick
    } as IShareTabsProps
  }

  /**
   * 获取 tabs 标题
   */
  const getTabsLabels = (commonProps: IShareLineProps = {}) => {
    let labels: Array<{ [K: string]: any }> = []
    if (commonProps.time !== null && commonProps.time !== undefined) {
      labels.push({
        label: commonProps.time.title || '',
        key: TabKeys[0] || ''
      })
    }

    if (commonProps.dailyK !== null && commonProps.dailyK !== undefined) {
      labels.push({
        label: commonProps.dailyK.title || '',
        key: TabKeys[1] || ''
      })
    }

    if (commonProps.weekK !== null && commonProps.weekK !== undefined) {
      labels.push({
        label: commonProps.weekK.title || '',
        key: TabKeys[2] || ''
      })
    }

    if (commonProps.monthK !== null && commonProps.monthK !== undefined) {
      labels.push({
        label: commonProps.monthK.title || '',
        key: TabKeys[3] || ''
      })
    }

    return labels || []
  }

  /**
   * 获取 Tabs
   */
  const getTabNode = (commonProps: IShareLineProps = {}) => {
    // 获取所有标题
    const labels = getTabsLabels(commonProps) || []
    if (labels.length === 0) {
      return null
    }

    const tabs = commonProps.tabs || {}
    return (
      <div className={`${commonProps.prefixClassName || ''}-share-tabs p-2`} ref={tabsRef}>
        <div
          className={`flex items-center rounded-xl pb-1 pt-1 pl-2 pr-2 ${tabs.className || ''} ${tabs.textColor || ''} ${tabs.fontClassName || ''}`}
        >
          {labels.map((item: { [K: string]: any } = {}, index: number) => {
            return (
              <div
                className={`${commonProps.prefixClassName || ''}-share-tabs-item flex-1 flex items-center justify-center cursor-pointer ${tabActiveItem.key === item.key ? `${tabs.activeClassName || ''} ${tabs.activeTextColor || ''}` : ''}`}
                key={item.key}
                onClick={() => {
                  if (tabActiveItem.key === item.key) return
                  setTabActiveItem(item)
                  tabs.onTabClick?.(index, item)
                }}
              >
                {item.label || ''}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /**
   * 获取公共属性
   */
  const getCommonProps = () => {
    const time = getTimeProps()
    const dailyK = getDailyKProps()
    const weekK = getWeekKProps()
    const monthK = getMonthKProps()
    const tabs = getTabsProps()

    const prefixClassName = Handler.getPrefixClassName(props.prefixClassName || '')
    const width = props.width ?? '100%'
    const height = props.height ?? '100%'
    const fontSize = props.fontSize ?? 0
    const fontFamily = Utils.isBlank(props.fontFamily || '') ? TimeKDefaultProps.fontFamily : props.fontFamily || ''
    return {
      ...props,
      prefixClassName,
      width,
      height,
      time,
      dailyK,
      weekK,
      monthK,
      tabs,
      fontSize,
      fontFamily
    } as IShareLineProps
  }

  /**
   * 获取分时图 | K线图公共属性
   */
  const getTimeKProps = (commonProps: IShareLineProps = {}) => {
    const prefixClassName = commonProps.prefixClassName || ''
    const width = timeKSize.width
    const height = timeKSize.height
    const type = commonProps.type ?? 'svg'
    const grid = commonProps.grid
    const axis = commonProps.axis
    const basic = commonProps.basic
    const highest = commonProps.highest
    const cross = commonProps.cross
    const tooltip = commonProps.tooltip
    const volume = commonProps.volume
    const closingPrice = commonProps.closingPrice ?? 0
    const riseColor = commonProps.riseColor || ''
    const fallColor = commonProps.fallColor || ''
    const flatColor = commonProps.flatColor || ''
    const fontSize = commonProps.fontSize ?? TimeKDefaultProps.fontSize
    const fontFamily = commonProps.fontFamily || ''

    return {
      prefixClassName,
      type,
      width,
      height,
      grid,
      axis,
      basic,
      highest,
      cross,
      tooltip,
      volume,
      closingPrice,
      riseColor,
      fallColor,
      flatColor,
      fontSize,
      fontFamily
    } as ITimeKProps
  }

  /**
   * 获取分时图
   */
  const getTimeLine = (commonProps: IShareLineProps = {}) => {
    const time = commonProps.time
    if (time === null || time === undefined) {
      return null
    }

    const className = time.className || ''
    const data = time.data || []
    const tradeTimes = time.tradeTimes || []
    const timeProps: ITimeProps = {
      ...getTimeKProps(commonProps),
      className,
      data,
      tradeTimes
    }

    return <TimeLine {...timeProps} />
  }

  /**
   * 获取日 K 图
   */
  const getDailyKLine = (commonProps: IShareLineProps = {}) => {
    const dailyK = commonProps.dailyK
    if (dailyK === null || dailyK === undefined) {
      return null
    }

    const className = dailyK.className || ''
    const data = dailyK.data || []
    const timeProps: IKProps = {
      ...getTimeKProps(commonProps),
      className,
      data
    }

    return <KLine {...timeProps} />
  }

  const render = () => {
    const commonProps = getCommonProps()
    return (
      <div
        className={`${commonProps.prefixClassName}-share-chart ${props.className || ''} flex flex-col`}
        style={{
          width: commonProps.width || '',
          height: commonProps.height || ''
        }}
        ref={ref}
      >
        {/* tabs */}
        {getTabNode(commonProps)}

        <div className={`${commonProps.prefixClassName}-share-chart-content flex-1 `}>
          {/* 分时图 */}
          {tabActiveItem.key === TabKeys[0] && getTimeLine(commonProps)}

          {/* 日 K 图*/}
          {tabActiveItem.key === TabKeys[1] && getDailyKLine(commonProps)}
        </div>
      </div>
    )
  }

  return render()
}

export default ShareLine
