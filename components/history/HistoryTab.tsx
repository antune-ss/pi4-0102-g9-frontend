"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { fetchDeviceIds, fetchReadings } from "@/lib/services/supabase"
import type { SensorReading } from "@/lib/types/sensor"
import { CRITICAL_CO2_PPM } from "@/lib/air-quality"
import { CriticalAlerts } from "@/components/history/CriticalAlerts"
import { HistoryFilters } from "@/components/history/HistoryFilters"
import { HistoryTable } from "@/components/history/HistoryTable"
import { AirPieChart } from "@/components/history/AirPieChart"

interface QueryState {
  key: string
  readings: SensorReading[]
  error: string | null
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getDefaultHistoryDates(): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 7)
  return {
    start: formatDateInput(start),
    end: formatDateInput(end),
  }
}

export function HistoryTab() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isReady, setIsReady] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState("all")
  const [onlyCritical, setOnlyCritical] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [registeredDevices, setRegisteredDevices] = useState<string[]>([])
  const [queryState, setQueryState] = useState<QueryState>({
    key: "",
    readings: [],
    error: null,
  })

  // Define como padrão a última semana inteira no cliente
  useEffect(() => {
    const { start, end } = getDefaultHistoryDates()
    setStartDate(start)
    setEndDate(end)
    setIsReady(true)
  }, [])

  // A chave muda quando filtros/retry mudam. Assim não mostramos a consulta
  // antiga como se já fosse o resultado dos novos filtros.
  const queryKey = JSON.stringify([
    startDate, endDate, selectedDevice, onlyCritical, retryCount,
  ])
  const isLoading = queryState.key !== queryKey
  const error = isLoading ? null : queryState.error
  const readings = isLoading || error ? [] : queryState.readings

  // Descobre dispositivos pelo cadastro, não só pelas últimas 100 medições.
  // Se sensor_device não estiver liberada via RLS, o histórico ainda funciona.
  useEffect(() => {
    let active = true
    async function loadDevices() {
      try {
        const devices = await fetchDeviceIds()
        if (active) setRegisteredDevices(devices)
      } catch (error) {
        console.warn("Lista de dispositivos indisponível:", error)
      }
    }
    void loadDevices()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!isReady) return
    let active = true

    async function loadData() {
      try {
        const data = await fetchReadings(undefined, {
          deviceId: selectedDevice,
          startDate,
          endDate,
          onlyCritical,
        })
        if (active) setQueryState({ key: queryKey, readings: data, error: null })
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Erro desconhecido ao consultar o histórico."
        if (active) setQueryState({ key: queryKey, readings: [], error: message })
      }
    }

    void loadData()
    // Desconsidera respostas de filtros anteriores (evita condições de corrida).
    return () => { active = false }
  }, [isReady, queryKey, startDate, endDate, selectedDevice, onlyCritical])

  const availableDevices = useMemo(() => {
    const ids = new Set([
      ...registeredDevices,
      ...queryState.readings.map(item => item.deviceId),
    ])
    // Nunca perde a seleção do usuário só porque a consulta atual veio vazia.
    if (selectedDevice !== "all") ids.add(selectedDevice)
    return Array.from(ids).filter(Boolean).sort()
  }, [registeredDevices, queryState.readings, selectedDevice])

  // Como os filtros já foram aplicados no Supabase, não filtramos de novo aqui.
  const totalReadings = readings.length
  const avgCo2 = totalReadings
    ? Math.round(readings.reduce((sum, item) => sum + item.co2, 0) / totalReadings)
    : 0
  const avgTemperature = totalReadings
    ? Number((readings.reduce((sum, item) => sum + item.temperature, 0) / totalReadings).toFixed(1))
    : 0
  const avgHumidity = totalReadings
    ? Math.round(readings.reduce((sum, item) => sum + item.humidity, 0) / totalReadings)
    : 0
  const criticalCount = readings.filter(item => item.co2 > CRITICAL_CO2_PPM).length

  function handleClearFilters() {
    setStartDate("")
    setEndDate("")
    setSelectedDevice("all")
    setOnlyCritical(false)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Histórico de Medições</h2>
        <p className="text-sm text-muted-foreground">
          Consulte todas as medições por período e dispositivo para auditoria e análise ambiental.
        </p>
      </div>

      <HistoryFilters
        startDate={startDate}
        endDate={endDate}
        selectedDevice={selectedDevice}
        onlyCritical={onlyCritical}
        availableDevices={availableDevices}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onDeviceChange={setSelectedDevice}
        onToggleOnlyCritical={() => setOnlyCritical(previous => !previous)}
        onClearFilters={handleClearFilters}
      />

      {error && (
        <div role="status" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
          <p className="font-semibold">Não foi possível carregar as medições do Supabase.</p>
          <p className="mt-1 wrap-break-words">{error}</p>
          <button
            type="button"
            onClick={() => setRetryCount(value => value + 1)}
            className="mt-3 rounded-lg border border-current px-3 py-1.5 font-semibold hover:bg-red-100 dark:hover:bg-red-950/60"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!error && (
        <>
          <CriticalAlerts
            totalReadings={totalReadings}
            avgCo2={avgCo2}
            avgTemperature={avgTemperature}
            avgHumidity={avgHumidity}
            criticalCount={criticalCount}
            onlyCritical={onlyCritical}
            isLoading={isLoading}
          />

          <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-6 items-start", isLoading && "opacity-90")}>
            <div className={cn(onlyCritical ? "lg:col-span-12" : "lg:col-span-7")}>
              <HistoryTable readings={readings} onlyCritical={onlyCritical} isLoading={isLoading} />
            </div>
            {!onlyCritical && (
              <div className="lg:col-span-5">
                <AirPieChart readings={readings} isLoading={isLoading} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
