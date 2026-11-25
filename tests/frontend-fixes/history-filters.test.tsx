import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { HistoryTab } from "@/components/history/HistoryTab"
import { fetchDeviceIds, fetchReadings } from "@/lib/services/supabase"
import type { SensorReading } from "@/lib/types/sensor"

vi.mock("@/lib/services/supabase", () => ({
  fetchReadings: vi.fn(),
  fetchDeviceIds: vi.fn(),
}))
vi.mock("@/components/history/AirPieChart", () => ({
  AirPieChart: () => <div data-testid="air-chart" />,
}))

const historic: SensorReading = {
  id: 10,
  deviceId: "ESP32-SALA-01",
  timestamp: "2026-11-15T14:00:00Z",
  co2: 1350,
  temperature: 25,
  humidity: 55,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(fetchReadings).mockResolvedValue([historic])
  vi.mocked(fetchDeviceIds).mockResolvedValue(["ESP32-SALA-01", "ESP32-SALA-02"])
})
afterEach(cleanup)

describe("Histórico com consulta filtrada no banco", () => {
  it("reconsulta o Supabase com datas sem limite fixo e inicia com intervalo padrão", async () => {
    render(<HistoryTab />)
    expect(await screen.findByText("ESP32-SALA-01")).toBeDefined()
    expect(fetchReadings).toHaveBeenCalledWith(undefined, {
      deviceId: "all", startDate: expect.any(String), endDate: expect.any(String), onlyCritical: false,
    })

    fireEvent.change(screen.getByLabelText("Data de"), {
      target: { value: "2026-11-15" },
    })
    await waitFor(() => expect(fetchReadings).toHaveBeenCalledWith(undefined, {
      deviceId: "all", startDate: "2026-11-15", endDate: expect.any(String), onlyCritical: false,
    }))
  })

  it("não apresenta falha como se fosse histórico sem registros e oferece tentar novamente", async () => {
    vi.mocked(fetchReadings).mockRejectedValueOnce(new Error("Falha de rede"))
    render(<HistoryTab />)
    expect(await screen.findByText("Não foi possível carregar as medições do Supabase.")).toBeDefined()
    expect(screen.getByText("Falha de rede")).toBeDefined()
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }))
    await waitFor(() => expect(vi.mocked(fetchReadings).mock.calls.length).toBeGreaterThanOrEqual(2))
    expect(await screen.findByText("ESP32-SALA-01")).toBeDefined()
  })
})
