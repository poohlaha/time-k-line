/**
 * @fileOverview 输出性情
 * @date 2025-04-28
 * @author poohlaha
 */

// Tooltip
export interface ITooltipProps {
  className?: string
  show?: boolean
  width?: number
  height?: number
  background?: string
}

export interface ITimeKTooltipProps extends ITooltipProps {
  x: number
  y: number
  data: Array<ITooltipDataProps>
}

export interface ITooltipDataProps {
  label: string
  value: string
}

export const TooltipDefaultDataProps = {
  background: 'white',
  show: true,
  width: 600
}
