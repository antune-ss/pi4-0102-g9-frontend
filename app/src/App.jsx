
import { useState } from 'react'
import IndicadorCard from './components/IndicadorCard'
import { medicoesSimuladas } from './mocks/medicoesMock'
import './App.css'

function App() {
  // Controla qual medição será exibida
  const [indiceMedicao, setIndiceMedicao] = useState(0)

  // Obtém a medição correspondente ao índice atual
  const medicaoAtual = medicoesSimuladas[indiceMedicao]

  // Simula a chegada de uma nova medição
  function simularNovaMedicao() {
    setIndiceMedicao((indiceAnterior) =>
      (indiceAnterior + 1) % medicoesSimuladas.length
    )
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
        <p>Modo de demonstração — dados simulados</p>

        <div className="indicadores">
          <IndicadorCard
            titulo="CO₂"
            valor={medicaoAtual.co2}
            unidade="ppm"
          />

          <IndicadorCard
            titulo="Temperatura"
            valor={medicaoAtual.temperature}
            unidade="°C"
          />

          <IndicadorCard
            titulo="Umidade"
            valor={medicaoAtual.humidity}
            unidade="%"
          />
        </div>

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
