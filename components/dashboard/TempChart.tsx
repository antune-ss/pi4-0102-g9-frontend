"use client"

import { SensorLineChart, type SensorChartProps } from "./SensorLineChart"

export function TempChart({ readings }: SensorChartProps) {
  return <SensorLineChart readings={readings} title="Temperatura" dataKey="temperature" unit="°C" color="var(--chart-3)" />
}
