"use client"

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { SensorReading } from "@/lib/types/sensor"

export interface SensorChartProps {
  readings: readonly SensorReading[]
}

interface SensorLineChartProps extends SensorChartProps {
  title: string
  dataKey: "co2" | "temperature" | "humidity"
  unit: string
  color: string
}

const timeFormat = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})
const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "medium",
})
const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })

export function SensorLineChart({ readings, title, dataKey, unit, color }: SensorLineChartProps) {
  const data = readings.map((reading) => ({
    timestamp: new Date(reading.timestamp).getTime(),
    value: reading[dataKey],
  }))

  return (
    <article aria-label={`${title} ao longo do tempo`} className="relative min-w-0 overflow-hidden rounded-[17px] border border-border bg-card p-3 sm:p-5 shadow-[0_5px_16px_rgba(25,53,54,0.045)]">
      <div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-primary to-ring" />
      <h3 className="mb-4 text-[15px] font-semibold text-muted-foreground">{title} ({unit})</h3>
      <div className="h-64 w-full min-w-0 text-xs text-muted-foreground">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 16, left: 0 }} accessibilityLayer>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(value: number) => timeFormat.format(value)}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              minTickGap={24}
              label={{ value: "Horário da medição", position: "insideBottom", offset: -12, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              width={76}
              tickFormatter={(value: number) => `${numberFormat.format(value)} ${unit}`}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              labelFormatter={(value) => dateTimeFormat.format(Number(value))}
              formatter={(value) => [`${numberFormat.format(Number(value))} ${unit}`, title]}
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--foreground)" }}
            />
            <Line type="linear" dataKey="value" name={title} stroke={color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}
