import { useState } from 'react'

function inicioDoDia(data) {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(ano, mes - 1, dia).getTime()
}

function inicioDoDiaSeguinte(data) {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(ano, mes - 1, dia + 1).getTime()
}

function RelatorioMedicoes({ medicoes = [] }) {
  const [dataDe, setDataDe] = useState('')
  const [dataAte, setDataAte] = useState('')
  const [periodoAplicado, setPeriodoAplicado] = useState(null)
  const [erroFiltro, setErroFiltro] = useState('')

  function pesquisarMedicoes(event) {
    event.preventDefault()

    if (!dataDe || !dataAte) {
      setErroFiltro('Preencha a data inicial e a data final.')
      return
    }

    if (dataDe > dataAte) {
      setErroFiltro(
        'A data inicial não pode ser posterior à data final.'
      )
      return
    }

    setErroFiltro('')
    setPeriodoAplicado({ dataDe, dataAte })
  }

  function limparFiltros() {
    setDataDe('')
    setDataAte('')
    setPeriodoAplicado(null)
    setErroFiltro('')
  }

  const medicoesFiltradas = medicoes.filter((medicao) => {
    const instante = new Date(medicao.data).getTime()

    if (!Number.isFinite(instante)) {
      return false
    }

    if (!periodoAplicado) {
      return true
    }

    const inicio = inicioDoDia(periodoAplicado.dataDe)
    const fim = inicioDoDiaSeguinte(periodoAplicado.dataAte)

    return instante >= inicio && instante < fim
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

  return (
    <section className="relatorio-section">
      <div className="relatorio-cabecalho">
        <div>
          <h2>Relatório de medições</h2>
          <p>
            Resumo das condições ambientais por período.
          </p>
        </div>
      </div>

      <form
        className="filtros-data"
        onSubmit={pesquisarMedicoes}
      >
        <label className="campo-data">
          Data de
          <input
            type="date"
            value={dataDe}
            onChange={(event) => {
              setDataDe(event.target.value)
              setErroFiltro('')
            }}
            max={dataAte || undefined}
          />
        </label>

        <label className="campo-data">
          Data até
          <input
            type="date"
            value={dataAte}
            onChange={(event) => {
              setDataAte(event.target.value)
              setErroFiltro('')
            }}
            min={dataDe || undefined}
          />
        </label>

        <div className="acoes-filtro">
          <button
            type="submit"
            className="botao-pesquisar"
          >
            Gerar relatório
          </button>

          <button
            type="button"
            className="botao-limpar"
            onClick={limparFiltros}
          >
            Limpar filtros
          </button>
        </div>
      </form>

      {erroFiltro && (
        <p className="aviso-erro-consulta" role="alert">
          {erroFiltro}
        </p>
      )}

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