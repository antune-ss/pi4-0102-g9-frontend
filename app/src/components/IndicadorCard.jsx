// Representar cada indicador 
function IndicadorCard({ titulo, valor, unidade }) {
  return (
    <article className="indicador-card">
      <h3>{titulo}</h3>

      <p>
        <strong>{valor}</strong> {unidade}
      </p>
    </article>
  )
}

export default IndicadorCard
