
import { useState } from 'react'
import { historicoMock } from '../mocks/historicoMock'

function RelatorioMedicoes() {
  const [intervalo, setIntervalo] = useState('24h')

  const duracoes = {
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  }

  const limite = Date.now() - duracoes[intervalo]

  const medicoesFiltradas = historicoMock.filter(
    (medicao) => new Date(medicao.data).getTime() >= limite
  )

  const quantidade = medicoesFiltradas.length

  function calcularMedia(campo) {
    if (quantidade === 0) {
      return null
    }

    const soma = medicoesFiltradas.reduce(
      (total, medicao) => total + medicao[campo],
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
            onChange={(event) => setIntervalo(event.target.value)}
          >
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
        <p className="relatorio-vazio">
          Nenhuma medição encontrada no período selecionado.
        </p>
      )}

      <p className="nota-dados">
        Relatório demonstrativo com dados simulados.
      </p>
    </section>
  )
}

export default RelatorioMedicoes
