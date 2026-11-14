"use client"

import { SensorLineChart, type SensorChartProps } from "./SensorLineChart"

export function HumidityChart({ readings }: SensorChartProps) {
  return <SensorLineChart readings={readings} title="Umidade" dataKey="humidity" unit="%" color="var(--chart-5)" />
}
