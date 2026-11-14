import styles from "./HelpContent.module.css";

const SHORTCUTS: readonly (readonly [string, string])[] = [
  ["Espaço", "gera, pausa ou continua"],
  ["Direita", "avança um passo, na pausa"],
  ["R", "reinicia"],
  ["F", "liga e desliga o modo exibição"],
  ["Setas", "movem o cursor na lista de algoritmos"],
  ["Enter", "confirma a opção do cursor"],
];

export function HelpContent() {
  return (
    <div className={styles.help}>
      <p>
        Escolha um algoritmo, ajuste os parâmetros e aperte Gerar. O mapa é
        construído aos poucos; a caixa de texto conta o que está acontecendo.
      </p>
      <dl className={styles.keys}>
        {SHORTCUTS.map(([key, action]) => (
          <div key={key}>
            <dt>
              <kbd>{key}</kbd>
            </dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>
      <p>
        A mesma seed com os mesmos parâmetros gera sempre o mesmo mapa.
        Parâmetros e tamanho alterados valem a partir da próxima geração. Os
        atalhos não valem enquanto você digita a seed.
      </p>
    </div>
  );
}
