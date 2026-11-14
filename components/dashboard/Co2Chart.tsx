"use client"

import { SensorLineChart, type SensorChartProps } from "./SensorLineChart"

export function Co2Chart({ readings }: SensorChartProps) {
  return <SensorLineChart readings={readings} title="CO₂" dataKey="co2" unit="ppm" color="var(--chart-1)" />
}
