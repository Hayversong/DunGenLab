import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

// Política de conteúdo do site publicado: só carrega script, estilo, fonte e
// imagem do próprio site, e não faz conexão nenhuma. É a mesma dos arquivos
// vercel.json e public/_headers; ali ela vai como cabeçalho, que é a forma
// mais forte. A meta tag cobre hospedagens que não deixam configurar
// cabeçalhos (GitHub Pages).
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self'",
  "connect-src 'none'",
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

// Só no build: o servidor de desenvolvimento do Vite injeta script e estilo
// direto na página, e a política os bloquearia.
function securityMeta(): Plugin {
  return {
    name: "security-meta",
    apply: "build",
    transformIndexHtml: () => [
      {
        tag: "meta",
        attrs: {
          "http-equiv": "Content-Security-Policy",
          content: CONTENT_SECURITY_POLICY,
        },
        injectTo: "head-prepend",
      },
      {
        tag: "meta",
        attrs: { name: "referrer", content: "no-referrer" },
        injectTo: "head-prepend",
      },
    ],
  };
}

// https://vite.dev/config/
export default defineConfig({
  // Caminhos relativos no build: o mesmo dist funciona na raiz de um domínio
  // (Vercel, Netlify) e em uma subpasta (GitHub Pages), sem saber o endereço.
  base: "./",
  plugins: [react(), securityMeta()],
  test: {
    // Por padrão o Vitest esvazia os arquivos CSS. O teste de contraste lê
    // as cores direto do arquivo de tokens, então precisa do conteúdo.
    css: true,
  },
});
