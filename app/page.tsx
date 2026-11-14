"use client"

import React, { useEffect, useState } from "react"
import { Logo } from "@/components/Logo"
import { IndicatorCard } from "@/components/IndicatorCard"
import { ChartsContainer } from "@/components/dashboard/ChartsContainer"
import { ReadingsHistory } from "@/components/ReadingsHistory"
import { ReadingsReport } from "@/components/ReadingsReport"
import { historyMock, simulatedReadings } from "@/lib/mocks/readingsMock"
import { DisplayPreferences, SensorReading } from "@/lib/types/sensor"

const DEFAULT_PREFERENCES: DisplayPreferences = {
  co2: true,
  temperature: true,
  humidity: true,
}

const PREFERENCES_STORAGE_KEY = "co2nect-display-preferences"

function loadPreferences(): DisplayPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES
  }

  try {
    const saved = localStorage.getItem(PREFERENCES_STORAGE_KEY)
    if (!saved) return { ...DEFAULT_PREFERENCES }

    const parsed = JSON.parse(saved)
    return {
      co2: typeof parsed?.co2 === "boolean" ? parsed.co2 : DEFAULT_PREFERENCES.co2,
      temperature:
        typeof parsed?.temperature === "boolean"
          ? parsed.temperature
          : DEFAULT_PREFERENCES.temperature,
      humidity:
        typeof parsed?.humidity === "boolean"
          ? parsed.humidity
          : DEFAULT_PREFERENCES.humidity,
    }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export default function DashboardPage() {
  const [readings, setReadings] = useState<SensorReading[]>(() => [...historyMock])
  const [nextSimulationIndex, setNextSimulationIndex] = useState(1)
  const [displayPreferences, setDisplayPreferences] =
    useState<DisplayPreferences>(DEFAULT_PREFERENCES)

  useEffect(() => {
    setDisplayPreferences(loadPreferences())
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify(displayPreferences)
      )
    } catch {
      // Ignora erro caso armazenamento local esteja bloqueado
    }
  }, [displayPreferences])

  const currentReading = readings[0]
  const hasAnyVisibleIndicator = Object.values(displayPreferences).some(Boolean)

  function simulateNewReading() {
    const nextData = simulatedReadings[nextSimulationIndex]
    const now = new Date()

    const newReading: SensorReading = {
      ...nextData,
      id: `simulated-${now.getTime()}`,
      deviceId: "ESP32-DEV",
      timestamp: now.toISOString(),
    }

    setReadings((previous) => [newReading, ...previous])
    setNextSimulationIndex(
      (previousIndex) => (previousIndex + 1) % simulatedReadings.length
    )
  }

  function toggleIndicator(indicator: keyof DisplayPreferences) {
    setDisplayPreferences((previous) => ({
      ...previous,
      [indicator]: !previous[indicator],
    }))
  }

  function formatLastUpdate(dateString: string): string {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(dateString))
  }

  return (
    <main className="mx-auto max-w-295 px-4 py-9 sm:px-6 space-y-7 text-foreground">
      {/* Cabeçalho com Logo, Degradê Verde e Círculos Concêntricos */}
      <header className="relative overflow-hidden rounded-[22px] border border-white/15 bg-linear-to-r from-[#103f40] to-primary px-8 py-9 sm:px-10 shadow-[0_12px_30px_rgba(16,63,64,0.13)] text-white">
        <div className="pointer-events-none absolute -top-28 -right-12 h-64 w-64 rounded-full border border-white/15 shadow-[0_0_0_28px_rgba(255,255,255,0.04),0_0_0_56px_rgba(255,255,255,0.03)]" />
        
        <div className="relative z-1 flex items-center gap-4 sm:gap-5">
          <Logo size={56} className="rounded-2xl shadow-md" />
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              CO₂NNECT
            </h1>
            <p className="mt-1 text-sm sm:text-[15px] text-[#d0ebe3]">
              Sistema de Monitoramento da Qualidade do Ar
            </p>
          </div>
        </div>
      </header>

      {/* Seção Principal do Dashboard */}
      <section className="rounded-[20px] border border-border bg-card p-7 sm:p-8 shadow-[0_5px_20px_rgba(25,53,54,0.04)] space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitoramento das condições ambientais
          </p>
          <p className="text-sm text-muted-foreground">
            Modo de demonstração com dados simulados.
          </p>

          {currentReading && (
            <div className="mt-3 inline-block rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">
              Última leitura simulada: {formatLastUpdate(currentReading.timestamp)}
            </div>
          )}
        </div>

        {/* Controles de Indicadores */}
        <div className="rounded-[15px] border border-border bg-muted/60 p-5">
          <h3 className="text-[15px] font-bold text-foreground mb-3.5">
            Indicadores exibidos
          </h3>

          <div className="flex flex-wrap gap-2.5">
            <label className="inline-flex items-center gap-2.5 rounded-[10px] border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-ring hover:bg-accent cursor-pointer">
              <input
                type="checkbox"
                checked={displayPreferences.co2}
                onChange={() => toggleIndicator("co2")}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
              CO₂
            </label>

            <label className="inline-flex items-center gap-2.5 rounded-[10px] border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-ring hover:bg-accent cursor-pointer">
              <input
                type="checkbox"
                checked={displayPreferences.temperature}
                onChange={() => toggleIndicator("temperature")}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
              Temperatura
            </label>

            <label className="inline-flex items-center gap-2.5 rounded-[10px] border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-ring hover:bg-accent cursor-pointer">
              <input
                type="checkbox"
                checked={displayPreferences.humidity}
                onChange={() => toggleIndicator("humidity")}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
              Umidade
            </label>
          </div>
        </div>

        {/* Grid de Cards dos Indicadores */}
        {!currentReading ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Ainda não há medições para exibir.
          </p>
        ) : hasAnyVisibleIndicator ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {displayPreferences.co2 && (
              <IndicatorCard
                title="CO₂"
                value={currentReading.co2}
                unit="ppm"
              />
            )}

            {displayPreferences.temperature && (
              <IndicatorCard
                title="Temperatura"
                value={currentReading.temperature}
                unit="°C"
              />
            )}

            {displayPreferences.humidity && (
              <IndicatorCard
                title="Umidade"
                value={currentReading.humidity}
                unit="%"
              />
            )}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Todos os indicadores estão ocultos. Selecione ao menos um para exibi-lo no dashboard.
          </p>
        )}

        <ChartsContainer readings={readings} />

        <div>
          <button
            type="button"
            onClick={simulateNewReading}
            className="inline-flex items-center justify-center rounded-[10px] border border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:-translate-y-0.5 hover:opacity-90 cursor-pointer"
          >
            Simular nova medição
          </button>
        </div>
      </section>

      {/* Histórico de Medições */}
      <ReadingsHistory readings={readings} />

      {/* Relatório de Medições */}
      <ReadingsReport readings={readings} />
    </main>
  )
}
