import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { CRITICAL_CO2_PPM } from "@/lib/air-quality"
import type { SensorReading } from "@/lib/types/sensor"

// O Next.js expõe ao navegador somente as variáveis NEXT_PUBLIC_*.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let initializationError: Error | null = null
let client: SupabaseClient | null = null

if (!supabaseUrl || !supabaseAnonKey) {
  initializationError = new Error("Supabase não configurado. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local.")
} else {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    initializationError = new Error(
      "Não foi possível inicializar o Supabase. Confira a URL e a chave publicável.",
      { cause: error }
    )
  }
}

export const supabase = client

function requireSupabase(): SupabaseClient {
  if (supabase) return supabase
  throw initializationError ?? new Error("Supabase indisponível.")
}

export interface ReadingFilters {
  deviceId?: string
  startDate?: string // YYYY-MM-DD (data local do navegador)
  endDate?: string   // YYYY-MM-DD (inclusive)
  onlyCritical?: boolean
}

function localStartOfDay(date: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Data inválida: use o formato AAAA-MM-DD.")
  }
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime()) ||
      `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}` !== date) {
    throw new Error("Data inválida no filtro de histórico.")
  }
  return parsed
}

/**
 * Consulta até `limit` registros APÓS filtrar no Supabase.
 * Uma consulta vazia retorna []; uma consulta com falha LANÇA um erro.
 */
export async function fetchReadings(
  limit?: number,
  filters: ReadingFilters = {}
): Promise<SensorReading[]> {
  if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1 || limit > 50000)) {
    throw new Error("Limite de consulta inválido.")
  }

  const db = requireSupabase()
  let query = db
    .from("sensor_reading")
    .select("id, device_id, co2, temperature, humidity, measured_at")

  if (filters.deviceId && filters.deviceId !== "all") {
    query = query.eq("device_id", filters.deviceId)
  }
  if (filters.startDate) {
    query = query.gte("measured_at", localStartOfDay(filters.startDate).toISOString())
  }
  if (filters.endDate) {
    const nextDay = localStartOfDay(filters.endDate)
    nextDay.setDate(nextDay.getDate() + 1)
    query = query.lt("measured_at", nextDay.toISOString())
  }
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    throw new Error("A data inicial não pode ser posterior à data final.")
  }
  if (filters.onlyCritical) {
    query = query.gt("co2", CRITICAL_CO2_PPM)
  }

  query = query.order("measured_at", { ascending: false })

  if (limit !== undefined) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Falha ao consultar medições no Supabase: ${error.message}`)
  }

  return (data ?? []).map(item => ({
    id: item.id,
    deviceId: item.device_id,
    timestamp: item.measured_at,
    co2: Number(item.co2),
    temperature: Number(item.temperature),
    humidity: Number(item.humidity),
  }))
}

/**
 * Lista dispositivos cadastrados.
 */
export async function fetchDevices(): Promise<string[]> {
  const { data, error } = await requireSupabase()
    .from("devices")
    .select("id")
    .order("id", { ascending: true })

  if (error) {
    throw new Error(`Falha ao consultar dispositivos: ${error.message}`)
  }

  return Array.from(new Set(
    (data ?? []).map(item => item.id).filter(
      (id): id is string => typeof id === "string" && id.trim().length > 0
    )
  ))
}

// Mantém compatibilidade com HistoryTab e testes existentes
export const fetchDeviceIds = fetchDevices
