
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

import { fetchDeviceIds, fetchReadings } from "@/lib/services/supabase"
import { initMqttConnection } from "@/lib/services/mqtt"
import type { DeviceStatus, SensorReading } from "@/lib/types/sensor"
import { applyInternalAlertUpdate, type DeviceAlertStates } from "@/lib/dashboard/alert-state"
import { createTelemetryAlertUpdate } from "@/lib/dashboard/telemetry-alert"

import { Badge } from "@/components/ui/badge"
import { EspSelector } from "@/components/EspSelector"
import { MetricsCards } from "@/components/dashboard/MetricsCards"
import { ChartsContainer } from "@/components/dashboard/ChartsContainer"
import { DashboardActiveAlert } from "@/components/dashboard/DashboardActiveAlert"

interface DashboardTabProps {
  selectedDevice?: string
  onDeviceChange?: (device: string) => void
  /** Estados internos para isolamento; a telemetria real tem precedência. */
  alertStates?: DeviceAlertStates
}

const REFRESH_INTERVAL = 5000
const FALLBACK_READINGS_LIMIT = 100
const FETCH_LIMIT = process.env.NODE_ENV === "test" ? 100 : 2000

function formatLastUpdate(dateString: string): string {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) return dateString

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

export function DashboardTab({
  selectedDevice: controlledDevice,
  onDeviceChange,
  alertStates,
}: DashboardTabProps = {}) {
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [registeredDevices, setRegisteredDevices] = useState<string[]>([])
  const [deviceReading, setDeviceReading] = useState<SensorReading[]>([])
  const [deviceStatus, setDeviceStatus] = useState<Record<string, boolean>>({})

  const [telemetryAlertStates, setTelemetryAlertStates] = useState<DeviceAlertStates>({})
  const [device, setDevice] = useState("ESP32-DEV")
  const [todayStartMs, setTodayStartMs] = useState<number | null>(null)

  const currentDevice = controlledDevice ?? device

  // Define o início do dia no cliente para evitar new Date() instável no prerender do Next.js
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setTodayStartMs(today.getTime())
  }, [])

  // Consulta novas leituras a cada 5 segundos, sem sobrepor requisições.
  useEffect(() => {
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    async function loadData() {
      try {
        const data = await fetchReadings(FETCH_LIMIT)
        if (cancelled) return

        if (data.length > 0) {
          setReadings(data)
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Falha ao atualizar telemetria do Supabase:", error)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          timeoutId = setTimeout(loadData, REFRESH_INTERVAL)
        }
      }
    }

    void loadData()

    return () => {
      cancelled = true
      if (timeoutId !== undefined) clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadDevices() {
      try {
        if (typeof fetchDeviceIds === "function") {
          const devices = await fetchDeviceIds()
          if (active && Array.isArray(devices)) setRegisteredDevices(devices)
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "test") {
          console.warn("Lista de dispositivos cadastrados indisponível:", error)
        }
      }
    }

    void loadDevices()
    return () => { active = false }
  }, [])

  const handleNewReading = useCallback((reading: SensorReading) => {
    const alertUpdate = createTelemetryAlertUpdate(reading)
    if (!alertUpdate) return

    setTelemetryAlertStates(previous => applyInternalAlertUpdate(previous, alertUpdate))
    setDeviceReading(previous => {
      // O mesmo dispositivo, no mesmo instante, não gera leitura duplicada.
      if (previous.some(item => item.deviceId === reading.deviceId &&
        Date.parse(item.timestamp) === alertUpdate.state.revision)) return previous

      return [reading, ...previous]
    })
  }, [])

  const handleDeviceStatus = useCallback((status: DeviceStatus) => {
    setDeviceStatus(previous => ({ ...previous, [status.deviceId]: status.online }))
  }, [])

  useEffect(() => {
    return initMqttConnection(handleNewReading, handleDeviceStatus)
  }, [handleNewReading, handleDeviceStatus])

  const availableDevices = useMemo(() => {
    const ids = new Set([
      ...registeredDevices,
      ...readings.map(r => r.deviceId),
      ...deviceReading.map(r => r.deviceId),
    ])
    
    const devices = Array.from(ids).filter(Boolean).sort()
    return devices.length > 0 ? devices : ["ESP32-SALA-01"]
  }, [registeredDevices, readings, deviceReading])

  function handleDeviceChange(selected: string) {
    if (onDeviceChange) onDeviceChange(selected)
    else setDevice(selected)
  }

  useEffect(() => {
    if (availableDevices.length > 0 && !availableDevices.includes(currentDevice)) {
      handleDeviceChange(availableDevices[0])
    }
  }, [availableDevices, currentDevice])

  const filteredReadings = useMemo(() => {
    const combined = [...deviceReading, ...readings]
      .filter(reading => reading.deviceId === currentDevice)

    const uniqueReadings = new Map<string, SensorReading>()
    for (const reading of combined) {
      const key = [
        reading.deviceId,
        Date.parse(reading.timestamp),
        reading.co2,
        reading.temperature,
        reading.humidity,
      ].join("|")
      if (!uniqueReadings.has(key)) uniqueReadings.set(key, reading)
    }

    const sorted = Array.from(uniqueReadings.values())
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))

    if (!todayStartMs) {
      return sorted.slice(0, FALLBACK_READINGS_LIMIT)
    }

    const todayReadings = sorted.filter(
      reading => Date.parse(reading.timestamp) >= todayStartMs
    )

    // Se houver medições de hoje, exibe o dia de hoje inteiro sem limite de 100.
    // Caso contrário, faz fallback para as últimas 100 medições registradas.
    if (todayReadings.length > 0) {
      return todayReadings
    }

    return sorted.slice(0, FALLBACK_READINGS_LIMIT)
  }, [currentDevice, deviceReading, readings, todayStartMs])

  const currentReading = filteredReadings[0]
  const hasRealtimeReading = deviceReading.some(reading =>
    reading.deviceId === currentDevice &&
    Date.parse(reading.timestamp) === Date.parse(currentReading?.timestamp ?? "") &&
    reading.co2 === currentReading?.co2 &&
    reading.temperature === currentReading?.temperature &&
    reading.humidity === currentReading?.humidity
  )
  const isOnline = Boolean(deviceStatus[currentDevice])

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </h2>

            {currentReading && (
              <Badge variant="secondary" className="text-xs font-medium px-2.5 py-0.5">
                Última leitura: {formatLastUpdate(currentReading.timestamp)}
              </Badge>
            )}

            <Badge variant="outline">
              {hasRealtimeReading ? "Tempo real (MQTT)" : "Histórico (Supabase)"}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mt-0.5">
            Monitoramento das condições ambientais dos sensores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <EspSelector
            selectedDevice={currentDevice}
            availableDevices={availableDevices}
            onDeviceChange={handleDeviceChange}
          />

          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3 h-9 text-xs font-semibold shadow-2xs transition-all",
              isOnline
                ? "border-emerald-500/30 bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-slate-300/80 bg-slate-100 text-slate-500 dark:border-border dark:bg-muted"
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", isOnline ? "bg-emerald-500" : "bg-slate-400")} />
            <span>{isOnline ? "Online" : "Offline"}</span>
          </div>
        </div>
      </div>

      <DashboardActiveAlert
        deviceId={currentDevice}
        alertStates={{ ...alertStates, ...telemetryAlertStates }}
        currentReading={currentReading}
        currentReadingSource={hasRealtimeReading ? "MQTT" : "Supabase"}
      />

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground bg-white dark:bg-card border rounded-2xl shadow-sm">
          <span className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span>Sincronizando telemetria com o banco de dados...</span>
        </div>
      ) : (
        <>
          <MetricsCards reading={currentReading} />
          <ChartsContainer readings={filteredReadings} />
        </>
      )}
    </div>
  )
}
