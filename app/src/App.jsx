import { useEffect, useState } from 'react'
import HistoricoMedicoes from './components/HistoricoMedicoes'
import IndicadorCard from './components/IndicadorCard'
import RelatorioMedicoes from './components/RelatorioMedicoes'
import { historicoMock } from './mocks/historicoMock'
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

    if (!preferenciasSalvas) {
      return { ...PREFERENCIAS_PADRAO }
    }

    const preferenciasLidas = JSON.parse(preferenciasSalvas)

    return {
      co2:
        typeof preferenciasLidas?.co2 === 'boolean'
          ? preferenciasLidas.co2
          : PREFERENCIAS_PADRAO.co2,

      temperature:
        typeof preferenciasLidas?.temperature === 'boolean'
          ? preferenciasLidas.temperature
          : PREFERENCIAS_PADRAO.temperature,

      humidity:
        typeof preferenciasLidas?.humidity === 'boolean'
          ? preferenciasLidas.humidity
          : PREFERENCIAS_PADRAO.humidity,
    }
  } catch {
    return { ...PREFERENCIAS_PADRAO }
  }
}

function App() {
  // Começa com os registros disponíveis no histórico simulado.
  const [medicoes, setMedicoes] = useState(() => [...historicoMock])

  // A próxima medição simulada será usada quando o botão for clicado.
  const [indiceProximaMedicao, setIndiceProximaMedicao] = useState(1)

  // Recupera as preferências de exibição salvas no navegador.
  const [indicadoresVisiveis, setIndicadoresVisiveis] =
    useState(carregarPreferencias)

  // A primeira medição da lista é sempre a mais recente.
  const medicaoAtual = medicoes[0]

  const algumIndicadorVisivel =
    Object.values(indicadoresVisiveis).some(Boolean)

  // Salva as preferências sempre que o usuário altera um indicador.
  useEffect(() => {
    try {
      localStorage.setItem(
        CHAVE_PREFERENCIAS,
        JSON.stringify(indicadoresVisiveis)
      )
    } catch {
      // O dashboard continua funcionando se o navegador bloquear o armazenamento.
    }
  }, [indicadoresVisiveis])

  function simularNovaMedicao() {
    const dadosSimulados =
      medicoesSimuladas[indiceProximaMedicao]

    const agora = new Date()

    const novaMedicao = {
      ...dadosSimulados,
      id: `simulada-${agora.getTime()}`,
      data: agora.toISOString(),
    }

    // Adiciona a nova medição sem apagar os registros anteriores.
    setMedicoes((anteriores) => [
      novaMedicao,
      ...anteriores,
    ])

    // Avança para o próximo conjunto de valores simulados.
    setIndiceProximaMedicao(
      (indiceAnterior) =>
        (indiceAnterior + 1) % medicoesSimuladas.length
    )
  }

  function alternarIndicador(indicador) {
    setIndicadoresVisiveis((anteriores) => ({
      ...anteriores,
      [indicador]: !anteriores[indicador],
    }))
  }

  function formatarUltimaAtualizacao(data) {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(data))
  }

  return (
    <main>
      <header>
        <h1>CO₂NNECT</h1>
        <p>Sistema de Monitoramento da Qualidade do Ar</p>
      </header>

      <section>
        <h2>Dashboard</h2>

        <p>Monitoramento das condições ambientais</p>

        <p>
          Modo de demonstração com dados simulados.
        </p>

        {medicaoAtual && (
          <p className="atualizacao-medicao">
            Última leitura simulada:{' '}
            {formatarUltimaAtualizacao(medicaoAtual.data)}
          </p>
        )}

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

        {!medicaoAtual ? (
          <p className="mensagem-sem-indicadores">
            Ainda não há medições para exibir.
          </p>
        ) : algumIndicadorVisivel ? (
          <div className="indicadores" aria-live="polite">
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
            Todos os indicadores estão ocultos. Selecione ao menos
            um para exibi-lo no dashboard.
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

      <HistoricoMedicoes medicoes={medicoes} />

      <RelatorioMedicoes medicoes={medicoes} />
    </main>
  )
}

export default App