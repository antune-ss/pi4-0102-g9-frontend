
import { useEffect, useState } from 'react'
import IndicadorCard from './components/IndicadorCard'
import { medicoesSimuladas } from './mocks/medicoesMock'
import './App.css'

const PREFERENCIAS_PADRAO = {
  co2: true,
  temperature: true,
  humidity: true,
}

const CHAVE_PREFERENCIAS = 'co2nnect-indicadores-visiveis'

function carregarPreferencias() {
  try {
    const preferenciasSalvas = localStorage.getItem(CHAVE_PREFERENCIAS)

    if (preferenciasSalvas) {
      return {
        ...PREFERENCIAS_PADRAO,
        ...JSON.parse(preferenciasSalvas),
      }
    }
  } catch {
    // Se as preferencias nao puderem ser lidas, usamos os valores padrao.
  }

  return PREFERENCIAS_PADRAO
}

function App() {
  const [indiceMedicao, setIndiceMedicao] = useState(0)

  const [indicadoresVisiveis, setIndicadoresVisiveis] =
    useState(carregarPreferencias)

  const medicaoAtual = medicoesSimuladas[indiceMedicao]

  useEffect(() => {
    localStorage.setItem(
      CHAVE_PREFERENCIAS,
      JSON.stringify(indicadoresVisiveis)
    )
  }, [indicadoresVisiveis])

  function simularNovaMedicao() {
    setIndiceMedicao((indiceAnterior) =>
      (indiceAnterior + 1) % medicoesSimuladas.length
    )
  }

  function alternarIndicador(indicador) {
    setIndicadoresVisiveis((anteriores) => ({
      ...anteriores,
      [indicador]: !anteriores[indicador],
    }))
  }

  const algumIndicadorVisivel =
    Object.values(indicadoresVisiveis).some(Boolean)

  return (
    <main>
      <header>
        <h1>CO₂NNECT</h1>
        <p>Sistema de Monitoramento da Qualidade do Ar</p>
      </header>

      <section>
        <h2>Dashboard</h2>
        <p>Monitoramento das condições ambientais</p>
        <p>Modo de demonstração — dados simulados</p>

        <div className="controles-indicadores">
          <h3>Indicadores exibidos</h3>

          <div className="opcoes-indicadores">
            <label>
              <input
                type="checkbox"
                checked={indicadoresVisiveis.co2}
                onChange={() => alternarIndicador('co2')}
              />
              CO₂
            </label>

            <label>
              <input
                type="checkbox"
                checked={indicadoresVisiveis.temperature}
                onChange={() => alternarIndicador('temperature')}
              />
              Temperatura
            </label>

            <label>
              <input
                type="checkbox"
                checked={indicadoresVisiveis.humidity}
                onChange={() => alternarIndicador('humidity')}
              />
              Umidade
            </label>
          </div>
        </div>

        {algumIndicadorVisivel ? (
          <div className="indicadores">
            {indicadoresVisiveis.co2 && (
              <IndicadorCard
                titulo="CO₂"
                valor={medicaoAtual.co2}
                unidade="ppm"
              />
            )}

            {indicadoresVisiveis.temperature && (
              <IndicadorCard
                titulo="Temperatura"
                valor={medicaoAtual.temperature}
                unidade="°C"
              />
            )}

            {indicadoresVisiveis.humidity && (
              <IndicadorCard
                titulo="Umidade"
                valor={medicaoAtual.humidity}
                unidade="%"
              />
            )}
          </div>
        ) : (
          <p className="mensagem-sem-indicadores">
            Todos os indicadores estão ocultos. Selecione ao menos um para
            exibi-lo no dashboard.
          </p>
        )}

        <button
          type="button"
          className="botao-simular"
          onClick={simularNovaMedicao}
        >
          Simular nova medição
        </button>
      </section>
    </main>
  )
}

export default App
