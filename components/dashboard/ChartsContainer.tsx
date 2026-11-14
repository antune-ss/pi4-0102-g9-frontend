"use client"

import type { SensorReading } from "@/lib/types/sensor"
import { Co2Chart } from "./Co2Chart"
import { TempChart } from "./TempChart"
import { HumidityChart } from "./HumidityChart"

interface ChartsContainerProps {
  readings: readonly SensorReading[]
}

export function ChartsContainer({ readings }: ChartsContainerProps) {
  if (readings.length === 0) {
    return (
      <p role="status" className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Ainda não há medições para exibir nos gráficos.
      </p>
    )
  }

  // Preserva a ordem da fonte compartilhada pelos cards, histórico e relatório.
  const sortedReadings = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return (
    <section aria-label="Evolução das medições" className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-3">
      <Co2Chart readings={sortedReadings} />
      <TempChart readings={sortedReadings} />
      <HumidityChart readings={sortedReadings} />
    </section>
  )
}
