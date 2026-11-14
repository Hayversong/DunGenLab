import type { MapMetrics } from "../core/metrics";
import { StatBar } from "./ui/StatBar";
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
    <div className={styles.metrics}>
      {metrics === null ? (
        <p className={styles.empty}>As métricas aparecem ao fim da geração.</p>
      ) : (
        <>
          <StatBar
            label="Chão"
            value={metrics.floorPercent}
            max={100}
            text={`${decimal.format(metrics.floorPercent)}%`}
          />
          <StatBar
            label="Maior região"
            value={metrics.largestRegionPercent}
            max={100}
            text={`${decimal.format(metrics.largestRegionPercent)}% do chão`}
            tone="green"
          />
          <dl className={styles.list}>
            <dt>Regiões conectadas</dt>
            <dd>{metrics.regionCount}</dd>

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
    </div>
  );
}
