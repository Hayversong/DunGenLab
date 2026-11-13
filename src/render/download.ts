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

  // Enquanto o endereço existir, o navegador mantém o blob na memória.
  // Libera no próximo turno, depois de o download já ter sido iniciado.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
