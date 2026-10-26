
const instanteInicial = Date.now()

function horasAtras(horas) {
  return new Date(
    instanteInicial - horas * 60 * 60 * 1000
  ).toISOString()
}

export const historicoMock = [
  { id: 1, data: horasAtras(1), co2: 820, temperature: 24.5, humidity: 55 },
  { id: 2, data: horasAtras(4), co2: 940, temperature: 25.1, humidity: 58 },
  { id: 3, data: horasAtras(8), co2: 770, temperature: 24.0, humidity: 51 },
  { id: 4, data: horasAtras(15), co2: 860, temperature: 24.8, humidity: 56 },
  { id: 5, data: horasAtras(27), co2: 910, temperature: 25.0, humidity: 57 },
  { id: 6, data: horasAtras(36), co2: 790, temperature: 23.9, humidity: 52 },
  { id: 7, data: horasAtras(55), co2: 830, temperature: 24.4, humidity: 54 },
  { id: 8, data: horasAtras(72), co2: 880, temperature: 24.7, humidity: 56 },
  { id: 9, data: horasAtras(120), co2: 760, temperature: 23.8, humidity: 50 },
  { id: 10, data: horasAtras(240), co2: 920, temperature: 25.2, humidity: 59 },
]
