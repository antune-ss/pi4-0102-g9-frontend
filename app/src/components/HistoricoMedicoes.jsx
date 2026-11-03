import { useState } from 'react'

function inicioDoDia(data) {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(ano, mes - 1, dia).getTime()
}

function inicioDoDiaSeguinte(data) {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(ano, mes - 1, dia + 1).getTime()
}

function HistoricoMedicoes({ medicoes = [] }) {
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

  const medicoesFiltradas = medicoes
    .filter((medicao) => {
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
    .sort(
      (a, b) =>
        new Date(b.data).getTime() -
        new Date(a.data).getTime()
    )

  function formatarData(data) {
    const instante = new Date(data)

    if (Number.isNaN(instante.getTime())) {
      return 'Data inválida'
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(instante)
  }

  return (
    <section className="historico-section">
      <div className="historico-cabecalho">
        <div>
          <h2>Histórico de medições</h2>
          <p>
            Consulte as leituras registradas em um período.
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
            Pesquisar
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