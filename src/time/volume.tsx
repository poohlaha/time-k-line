/**
 * @fileOverview 成交量柱状图
 * @date 2023-08-28
 * @author poohlaha
 */
import React, { ReactElement } from 'react'
import { ITimeVolumeProps } from '../types/time'

const Volume = (props: ITimeVolumeProps): ReactElement => {
  const render = () => {
    // width * 0.8, 给每根柱子留点间隙
    return <rect x={props.x} y={props.y} width={props.width * 0.8} height={props.height} fill={props.color} />
  }

  return render()
}

export default Volume
