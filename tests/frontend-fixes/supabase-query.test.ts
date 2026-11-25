import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "publishable-test-key"

  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(),
    lt: vi.fn(),
    gt: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.gte.mockReturnValue(query)
  query.lt.mockReturnValue(query)
  query.gt.mockReturnValue(query)
  query.order.mockReturnValue(query)

  return {
    query,
    from: vi.fn(() => query),
  }
})

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mocks.from }),
}))

import { fetchReadings } from "@/lib/services/supabase"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.query.limit.mockResolvedValue({ data: [], error: null })
})

describe("consulta Supabase filtrada antes do limite", () => {
  it("aplica dispositivo, datas e crítico antes de order e limit(100)", async () => {
    const result = await fetchReadings(100, {
      deviceId: "ESP32-SALA-01",
      startDate: "2026-11-15",
      endDate: "2026-11-15",
      onlyCritical: true,
    })
    expect(result).toEqual([])
    expect(mocks.from).toHaveBeenCalledWith("sensor_reading")
    expect(mocks.query.eq).toHaveBeenCalledWith("device_id", "ESP32-SALA-01")
    expect(mocks.query.gte).toHaveBeenCalledWith("measured_at", expect.any(String))
    expect(mocks.query.lt).toHaveBeenCalledWith("measured_at", expect.any(String))
    expect(mocks.query.gt).toHaveBeenCalledWith("co2", 1200)
    expect(mocks.query.order).toHaveBeenCalledWith("measured_at", { ascending: false })
    expect(mocks.query.limit).toHaveBeenCalledWith(100)
  })

  it("não aplica limit quando limit é undefined", async () => {
    const result = await fetchReadings(undefined, {
      deviceId: "ESP32-SALA-01",
    })
    expect(result).toEqual([])
    expect(mocks.query.limit).not.toHaveBeenCalled()
  })

  it("diferencia uma consulta vazia de um erro do banco", async () => {
    expect(await fetchReadings(100)).toEqual([])
    mocks.query.limit.mockResolvedValueOnce({ data: null, error: { message: "permission denied" } })
    await expect(fetchReadings(100)).rejects.toThrow("permission denied")
  })
})
