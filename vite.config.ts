import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  // Caminhos relativos no build: o mesmo dist funciona na raiz de um domínio
  // (Vercel, Netlify) e em uma subpasta (GitHub Pages), sem saber o endereço.
  base: "./",
  plugins: [react()],
  test: {
    // Por padrão o Vitest esvazia os arquivos CSS. O teste de contraste lê
    // as cores direto do arquivo de tokens, então precisa do conteúdo.
    css: true,
  },
});
