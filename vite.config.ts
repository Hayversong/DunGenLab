import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  // Caminhos relativos no build: o mesmo dist funciona na raiz de um domínio
  // (Vercel, Netlify) e em uma subpasta (GitHub Pages), sem saber o endereço.
  base: "./",
  plugins: [react()],
});
