// Milissegundos entre o clique de download e a liberação do endereço.
const REVOKE_DELAY = 10_000;

// Faz o navegador baixar um conteúdo que só existe na memória da página.
export function downloadBlob(blob: Blob, fileName: string): void {
  // Endereço temporário que aponta para o blob, válido só nesta página.
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  // Alguns navegadores só aceitam o clique se o link estiver no documento.
  document.body.append(link);
  link.click();
  link.remove();

  // Enquanto o endereço existir, o navegador mantém o blob na memória. A
  // liberação espera alguns segundos: há navegadores que só começam o
  // download um pouco depois do clique, e o endereço precisa estar vivo.
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY);
}
