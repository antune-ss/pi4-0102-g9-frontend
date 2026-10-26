import { useState } from 'react'

const INSTANTE_INICIAL = Date.now()

function RelatorioMedicoes({ medicoes = [] }) {
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

  const medicoesFiltradas = medicoes.filter((medicao) => {
    const instante = new Date(medicao.data).getTime()

    return (
      Number.isFinite(instante) &&
      instante >= limite
    )
  })

  const quantidade = medicoesFiltradas.length

  function calcularMedia(campo) {
    if (quantidade === 0) {
      return null
    }

    const soma = medicoesFiltradas.reduce(
      (total, medicao) => total + Number(medicao[campo]),
      0
    )

    return soma / quantidade
  }

  function formatarMedia(campo) {
    const media = calcularMedia(campo)

    if (media === null) {
      return '—'
    }

    const casasDecimais = campo === 'co2' ? 0 : 1

    return media.toLocaleString('pt-BR', {
      minimumFractionDigits: casasDecimais,
      maximumFractionDigits: casasDecimais,
    })
  }

  function alterarIntervalo(event) {
    setIntervalo(event.target.value)
    setAgora(Date.now())
  }

  return (
    <section className="relatorio-section">
      <div className="relatorio-cabecalho">
        <div>
          <h2>Relatório de medições</h2>
          <p>Resumo das condições ambientais por período.</p>
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

      <div className="relatorio-resumo">
        <article className="relatorio-card">
          <h3>Média de CO₂</h3>
          <p>
            <strong>{formatarMedia('co2')}</strong> ppm
          </p>
        </article>

        <article className="relatorio-card">
          <h3>Média de temperatura</h3>
          <p>
            <strong>{formatarMedia('temperature')}</strong> °C
          </p>
        </article>

        <article className="relatorio-card">
          <h3>Média de umidade</h3>
          <p>
            <strong>{formatarMedia('humidity')}</strong> %
          </p>
        </article>

        <article className="relatorio-card">
          <h3>Total de medições</h3>
          <p>
            <strong>{quantidade}</strong>
          </p>
        </article>
      </div>

      {quantidade === 0 && (
        <p className="relatorio-vazio" aria-live="polite">
          Nenhuma medição encontrada no período selecionado.
        </p>
      )}

      <p className="nota-dados">
        {quantidade}{' '}
        {quantidade === 1
          ? 'medição considerada'
          : 'medições consideradas'}{' '}
        no relatório. Dados simulados para demonstração.
      </p>
    </section>
  )
}

export default RelatorioMedicoes