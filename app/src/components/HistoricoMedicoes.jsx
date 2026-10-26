import { useState } from 'react'

const INSTANTE_INICIAL = Date.now()

function HistoricoMedicoes({ medicoes = [] }) {
  const [intervalo, setIntervalo] = useState('24h')
  const [agora, setAgora] = useState(INSTANTE_INICIAL)

  const duracoes = {
    '30min': 30 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  }

  const limite = agora - duracoes[intervalo]

  const medicoesFiltradas = medicoes
    .filter((medicao) => {
      const instante = new Date(medicao.data).getTime()

      return (
        Number.isFinite(instante) &&
        instante >= limite
      )
    })
    .sort(
      (a, b) =>
        new Date(b.data).getTime() -
        new Date(a.data).getTime()
    )

  function formatarData(data) {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(data))
  }

  function alterarIntervalo(event) {
    setIntervalo(event.target.value)
    setAgora(Date.now())
  }

  return (
    <section className="historico-section">
      <div className="historico-cabecalho">
        <div>
          <h2>Histórico de medições</h2>
          <p>Consulte as leituras registradas por período.</p>
        </div>

        <label className="seletor-periodo">
          Período

          <select
            value={intervalo}
            onChange={alterarIntervalo}
          >
            <option value="30min">Últimos 30 minutos</option>
            <option value="6h">Últimas 6 horas</option>
            <option value="24h">Últimas 24 horas</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
          </select>
        </label>
      </div>

      {medicoesFiltradas.length > 0 ? (
        <div className="tabela-wrapper">
          <table className="tabela-medicoes">
            <thead>
              <tr>
                <th>Data e hora</th>
                <th>CO₂ (ppm)</th>
                <th>Temperatura (°C)</th>
                <th>Umidade (%)</th>
              </tr>
            </thead>

            <tbody>
              {medicoesFiltradas.map((medicao) => (
                <tr key={medicao.id}>
                  <td>{formatarData(medicao.data)}</td>

                  <td>
                    {medicao.co2.toLocaleString('pt-BR')}
                  </td>

                  <td>
                    {medicao.temperature.toLocaleString(
                      'pt-BR',
                      {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      }
                    )}
                  </td>

                  <td>{medicao.humidity}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="historico-vazio" aria-live="polite">
          Nenhuma medição encontrada no período selecionado.
        </p>
      )}

      <p className="nota-dados">
        {medicoesFiltradas.length}{' '}
        {medicoesFiltradas.length === 1
          ? 'medição encontrada'
          : 'medições encontradas'}{' '}
        no período. Dados simulados para demonstração.
      </p>
    </section>
  )
}

export default HistoricoMedicoes