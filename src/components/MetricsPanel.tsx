import type { MapMetrics } from "../core/metrics";
import styles from "./MetricsPanel.module.css";

interface MetricsPanelProps {
  metrics: MapMetrics | null;
  // Só o BSP informa; null esconde a linha.
  roomCount: number | null;
  // null quando a geração terminou pela animação, sem medição.
  elapsedMs: number | null;
  // Mapa vindo de arquivo: não houve geração, então não há tempo a medir.
  imported: boolean;
}

// Uma casa decimal, com vírgula.
const decimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function MetricsPanel({
  metrics,
  roomCount,
  elapsedMs,
  imported,
}: MetricsPanelProps) {
  return (
    <section className={styles.metrics} aria-labelledby="metrics-title">
      <h2 id="metrics-title">Métricas</h2>

      {metrics === null ? (
        <p className={styles.empty}>As métricas aparecem ao fim da geração.</p>
      ) : (
        <>
          <dl className={styles.list}>
            <dt>Chão</dt>
            <dd>{decimal.format(metrics.floorPercent)}%</dd>

            <dt>Regiões conectadas</dt>
            <dd>{metrics.regionCount}</dd>

            <dt>Maior região</dt>
            <dd>{decimal.format(metrics.largestRegionPercent)}% do chão</dd>

            {roomCount !== null && (
              <>
                <dt>Salas</dt>
                <dd>{roomCount}</dd>
              </>
            )}

            <dt>Tempo de geração</dt>
            <dd>
              {elapsedMs === null
                ? "não medido"
                : `${decimal.format(elapsedMs)} ms`}
            </dd>
          </dl>
          {elapsedMs === null && (
            <p className={styles.hint}>
              {imported
                ? "Este mapa veio de um arquivo, então não há geração para medir."
                : "O tempo é medido ao usar Finalizar, que gera sem a animação."}
            </p>
          )}
        </>
      )}
    </section>
  );
}
